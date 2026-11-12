"""Synthesize one clip per subtitle cue.

Providers (pick with TTS_PROVIDER, default "piper"):
  piper       local, free, open-source voice (zh_CN-huayan-medium). No credentials.
  azure       Azure AI Speech REST. Needs AZURE_SPEECH_KEY + AZURE_SPEECH_REGION. Voice: AZURE_VOICE (default zh-CN-XiaoxiaoNeural).
  elevenlabs  Needs ELEVENLABS_API_KEY (+ ELEVENLABS_VOICE_ID). Model eleven_multilingual_v2.
  openai      Needs OPENAI_API_KEY. Voice OPENAI_VOICE (default "nova").
Keys are read from the environment only and never written to disk or logs.
Output: out/tts/cue_NN.wav (48 kHz mono float) + out/tts/durations.json
"""
import json, os, sys, wave, io, urllib.request
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
sys.path.insert(0, os.path.dirname(__file__))
from zh_numbers import speakable

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CUES = json.load(open(os.path.join(ROOT, "src/subtitles.plan.json"), encoding="utf-8"))  # planned cues (display text + intended slots)
OUT = os.path.join(ROOT, "out/tts")
os.makedirs(OUT, exist_ok=True)
SR = 48000
PROVIDER = os.environ.get("TTS_PROVIDER", "piper")

def to_48k_mono(data, sr):
    if data.ndim > 1:
        data = data.mean(axis=1)
    if sr != SR:
        from math import gcd
        g = gcd(SR, sr)
        data = resample_poly(data, SR // g, sr // g)
    return data.astype(np.float32)

def trim_silence(x, thresh=0.004, pad=0.06):
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(pad * SR)); b = min(len(x), idx[-1] + int(pad * SR))
    return x[a:b]

def piper_synth(text):
    from piper import PiperVoice
    from piper.config import SynthesisConfig
    global _voice
    if "_voice" not in globals():
        _voice = PiperVoice.load(os.path.join(OUT, "models/zh_CN-huayan-medium.onnx"))
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        _voice.synthesize_wav(text, w, SynthesisConfig(length_scale=float(os.environ.get("PIPER_LENGTH", "1.08")), noise_scale=0.45, noise_w_scale=0.55))
    buf.seek(0)
    data, sr = sf.read(buf, dtype="float32")
    return to_48k_mono(data, sr)

def http_post(url, headers, body):
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()

def azure_synth(text):
    key = os.environ["AZURE_SPEECH_KEY"]; region = os.environ["AZURE_SPEECH_REGION"]
    voice = os.environ.get("AZURE_VOICE", "zh-CN-XiaoxiaoNeural")
    style = os.environ.get("AZURE_STYLE", "newscast-casual")
    ssml = f"""<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='zh-CN'>
<voice name='{voice}'><mstts:express-as style='{style}'><prosody rate='-4%' pitch='-2%'>{text}</prosody></mstts:express-as></voice></speak>"""
    raw = http_post(f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1",
                    {"Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml",
                     "X-Microsoft-OutputFormat": "riff-48khz-16bit-mono-pcm", "User-Agent": "nyx-lab-tts"}, ssml.encode("utf-8"))
    data, sr = sf.read(io.BytesIO(raw), dtype="float32")
    return to_48k_mono(data, sr)

def elevenlabs_synth(text):
    key = os.environ["ELEVENLABS_API_KEY"]; vid = os.environ.get("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")
    body = json.dumps({"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.6, "similarity_boost": 0.8, "style": 0.2}}).encode()
    raw = http_post(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=pcm_44100",
                    {"xi-api-key": key, "Content-Type": "application/json"}, body)
    data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    return to_48k_mono(data, 44100)

def openai_synth(text):
    key = os.environ["OPENAI_API_KEY"]
    body = json.dumps({"model": os.environ.get("OPENAI_TTS_MODEL", "tts-1-hd"), "voice": os.environ.get("OPENAI_VOICE", "nova"), "input": text, "response_format": "wav"}).encode()
    raw = http_post("https://api.openai.com/v1/audio/speech", {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, body)
    data, sr = sf.read(io.BytesIO(raw), dtype="float32")
    return to_48k_mono(data, sr)

SYNTH = {"piper": piper_synth, "azure": azure_synth, "elevenlabs": elevenlabs_synth, "openai": openai_synth}[PROVIDER]

durations = []
for i, c in enumerate(CUES):
    text = speakable(c["text"]) if PROVIDER == "piper" else c["text"]
    x = trim_silence(SYNTH(text))
    peak = np.max(np.abs(x)) or 1.0
    x = x / peak * 0.9
    path = os.path.join(OUT, f"cue_{i:02d}.wav")
    sf.write(path, x, SR)
    durations.append({"index": i, "text": c["text"], "spoken": text, "duration": round(len(x) / SR, 3), "file": path})
    print(f"{i:02d} {len(x)/SR:5.2f}s  {c['text']}")
json.dump({"provider": PROVIDER, "cues": durations}, open(os.path.join(OUT, "durations.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("total speech", round(sum(d["duration"] for d in durations), 2), "s")
