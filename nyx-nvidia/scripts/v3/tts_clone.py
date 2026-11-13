"""Step 2: synthesize every cue with Qwen3-TTS Base, cloning the designed Nyx narrator reference (one consistent voice).
Resumable: existing clips are kept. Pass cue ids to force re-generation (optionally id:seed)."""
import time, sys, os, json, numpy as np, soundfile as sf, torch
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "audio"))
from qwen_common import load, OUT, SCRIPT
from zh_numbers import speakable
REF = os.path.join(OUT, os.environ.get("REF_WAV", "ref_seed11.wav"))
REF_TEXT = open(os.path.join(OUT, "ref_text.txt"), encoding="utf-8").read()
force = {a.split(":")[0]: int(a.split(":")[1]) if ":" in a else 101 for a in sys.argv[1:]}
dpath = os.path.join(OUT, "durations.json")
durs = json.load(open(dpath, encoding="utf-8")) if os.path.exists(dpath) else {}
def say(text):
    return speakable(text).replace("C E O", "CEO").replace("C F O", "CFO")
def trim(x, sr, thresh=0.006, pad=0.05):
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0: return x
    return x[max(0, idx[0] - int(pad * sr)): min(len(x), idx[-1] + int(pad * sr))]
m = load("qwen3-tts-base")
prompt = m.create_voice_clone_prompt(ref_audio=REF, ref_text=REF_TEXT)
cues = [c for sc in SCRIPT["scenes"] for c in sc["cues"]]
for i, c in enumerate(cues):
    p = os.path.join(OUT, c["id"] + ".wav")
    if os.path.exists(p) and c["id"] not in force and durs.get(c["id"], {}).get("text") == c["text"]: continue
    seed = force.get(c["id"], 7 + i); torch.manual_seed(seed); t0 = time.time()
    wavs, sr = m.generate_voice_clone(text=say(c["text"]), language="Chinese", voice_clone_prompt=prompt)
    x = trim(np.asarray(wavs[0], dtype=np.float32), sr)
    sf.write(p, x, sr)
    durs[c["id"]] = {"duration": round(len(x) / sr, 3), "text": c["text"], "spoken": say(c["text"]), "seed": seed, "cps": round(len(c["text"]) / (len(x) / sr), 2)}
    json.dump(durs, open(dpath, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{c['id']:12s} {len(x)/sr:5.2f}s  gen {time.time()-t0:4.0f}s  {say(c['text'])}", flush=True)
print("total speech", round(sum(durs[c["id"]]["duration"] for c in cues), 1), "s")
