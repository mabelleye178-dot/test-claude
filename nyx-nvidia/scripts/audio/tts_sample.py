"""Phase-1 voice comparison: three 12-15 s samples of the same passage.
  A  Azure zh-CN-XiaoxiaoNeural, style=newscast (plus a 'serious' take)
  B  Azure Neural HD Chinese female (auto-picked from the live voice list: Xiaochen DragonHD, else Xiaoxiao DragonHD Flash)
  C  ElevenLabs, newest multilingual model (v4 if the account exposes it, else v3 / multilingual_v2)
Credentials: never pasted here. Either (1) the Claude Code environment injects the key as a network secret for the host
(then any placeholder header value works), or (2) set AZURE_SPEECH_KEY / ELEVENLABS_API_KEY in the environment.
Outputs: out/demo/voice-A-azure-xiaoxiao-newscast.wav, voice-A2-azure-xiaoxiao-serious.wav, voice-B-azure-hd-<voice>.wav, voice-C-elevenlabs-<voice>.wav
"""
import io, json, os, sys, urllib.request, urllib.error
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(__file__))
from lexicon import to_azure_ssml_text, to_plain

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "out/demo"); os.makedirs(OUT, exist_ok=True)
REGION = os.environ.get("AZURE_SPEECH_REGION", "eastus")
AZ_HOST = f"https://{REGION}.tts.speech.microsoft.com"
AZ_KEY = os.environ.get("AZURE_SPEECH_KEY", "injected-by-proxy")
EL_KEY = os.environ.get("ELEVENLABS_API_KEY", "injected-by-proxy")

SAMPLE = "黄仁勋持有约8.7亿股，占3.58%。先锋领航7.31%，贝莱德7.43%。2025年，H20出口先受限，后放行。11月12日，黄仁勋辞任，克雷斯代理CEO。"

def call(url, headers, body=None, method=None):
    req = urllib.request.Request(url, data=body, headers=headers, method=method or ("POST" if body else "GET"))
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()

def save(name, raw_wav_bytes):
    data, sr = sf.read(io.BytesIO(raw_wav_bytes), dtype="float32")
    data = data / (np.max(np.abs(data)) or 1) * 0.9
    p = os.path.join(OUT, name); sf.write(p, data, sr); print(f"  -> {p}  {len(data)/sr:.1f}s"); return p

# ---------- Azure ----------
def azure_voices():
    st, body = call(f"{AZ_HOST}/cognitiveservices/voices/list", {"Ocp-Apim-Subscription-Key": AZ_KEY})
    if st != 200:
        print(f"Azure voice list: HTTP {st} {body[:200]!r}"); return []
    v = json.loads(body)
    zh = [x for x in v if x.get("Locale") == "zh-CN" and x.get("Gender") == "Female"]
    print(f"Azure: {len(zh)} zh-CN female voices available in {REGION}")
    for x in zh:
        if "HD" in x["ShortName"] or x["ShortName"] in ("zh-CN-XiaoxiaoNeural", "zh-CN-XiaoyiNeural", "zh-CN-XiaochenNeural"):
            print("   ", x["ShortName"], x.get("VoiceType"), x.get("StyleList", []))
    return zh

def azure_tts(voice, style=None, rate="-5%", pitch="-2%", name="sample"):
    inner = to_azure_ssml_text(SAMPLE)
    body = f"<prosody rate='{rate}' pitch='{pitch}'>{inner}</prosody>"
    if style: body = f"<mstts:express-as style='{style}' styledegree='1.0'>{body}</mstts:express-as>"
    ssml = f"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='zh-CN'><voice name='{voice}'>{body}</voice></speak>"
    st, raw = call(f"{AZ_HOST}/cognitiveservices/v1", {"Ocp-Apim-Subscription-Key": AZ_KEY, "Content-Type": "application/ssml+xml",
                   "X-Microsoft-OutputFormat": "riff-48khz-16bit-mono-pcm", "User-Agent": "nyx-lab-tts"}, ssml.encode("utf-8"))
    if st != 200:
        print(f"  {voice} {style}: HTTP {st} {raw[:200]!r}"); return None
    return save(name, raw)

# ---------- ElevenLabs ----------
def eleven_models():
    st, body = call("https://api.elevenlabs.io/v1/models", {"xi-api-key": EL_KEY})
    if st != 200:
        print(f"ElevenLabs models: HTTP {st} {body[:200]!r}"); return []
    ms = json.loads(body); ids = [m["model_id"] for m in ms if m.get("can_do_text_to_speech")]
    print("ElevenLabs TTS models:", ids); return ids

def eleven_voice():
    st, body = call("https://api.elevenlabs.io/v1/voices", {"xi-api-key": EL_KEY})
    if st != 200: return "EXAVITQu4vr4xnSDxMaL", "Sarah"
    vs = json.loads(body)["voices"]
    pref = [v for v in vs if (v.get("labels", {}).get("gender") == "female") and any(k in (v.get("labels", {}).get("description", "") + v.get("labels", {}).get("use_case", "")).lower() for k in ("narrat", "news", "calm", "professional", "mature"))]
    v = (pref or [x for x in vs if x.get("labels", {}).get("gender") == "female"] or vs)[0]
    return v["voice_id"], v["name"]

def eleven_tts(model, voice_id, name):
    body = json.dumps({"text": to_plain(SAMPLE), "model_id": model, "language_code": "zh",
                       "voice_settings": {"stability": 0.65, "similarity_boost": 0.8, "style": 0.15, "use_speaker_boost": True}}).encode()
    st, raw = call(f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=pcm_44100",
                   {"xi-api-key": EL_KEY, "Content-Type": "application/json"}, body)
    if st != 200:
        print(f"  ElevenLabs {model}: HTTP {st} {raw[:200]!r}"); return None
    data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    p = os.path.join(OUT, name); sf.write(p, data / (np.max(np.abs(data)) or 1) * 0.9, 44100); print(f"  -> {p}  {len(data)/44100:.1f}s"); return p

if __name__ == "__main__":
    which = sys.argv[1:] or ["azure", "elevenlabs"]
    if "azure" in which:
        zh = azure_voices()
        names = {x["ShortName"] for x in zh}
        print("A: Xiaoxiao newscast / serious")
        azure_tts("zh-CN-XiaoxiaoNeural", "newscast", name="voice-A-azure-xiaoxiao-newscast.wav")
        azure_tts("zh-CN-XiaoxiaoNeural", "serious", name="voice-A2-azure-xiaoxiao-serious.wav")
        hd = next((n for n in ("zh-CN-Xiaochen:DragonHDLatestNeural", "zh-CN-Xiaoxiao:DragonHDFlashLatestNeural", "zh-CN-Xiaoxiao:DragonHDLatestNeural") if n in names), None)
        hd = hd or next((n for n in names if "HD" in n), None)
        if hd:
            print("B: HD voice", hd); azure_tts(hd, None, name=f"voice-B-azure-hd-{hd.split('-')[2].split(':')[0].lower()}.wav")
        else:
            print("B: no Neural HD zh-CN voice listed in this region")
    if "elevenlabs" in which:
        ids = eleven_models()
        model = next((m for m in ("eleven_v4", "eleven_v3", "eleven_multilingual_v2") if m in ids), ids[0] if ids else None)
        if model:
            vid, vname = eleven_voice(); print("C:", model, vname)
            eleven_tts(model, vid, f"voice-C-elevenlabs-{vname.lower()}.wav")
