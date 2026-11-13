"""ASR verification with faster-whisper. Compares toneless pinyin of what was said against the script.
Usage: asr_check.py file.wav "reference text" [...pairs]   |   asr_check.py --cues   (all cue clips)
"""
import sys, os, re, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "audio"))
from zh_numbers import speakable
from pypinyin import lazy_pinyin
from faster_whisper import WhisperModel
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_model = None
def model():
    global _model
    if _model is None:
        _model = WhisperModel(os.environ.get("ASR_MODEL", "large-v3-turbo"), device="cpu", compute_type="int8", cpu_threads=4, download_root=os.path.join(ROOT, "out/tts/models/whisper"))
    return _model
def norm(t):
    t = speakable(t).replace("C E O", "CEO").replace("C F O", "CFO")
    t = re.sub(r"[^一-鿿A-Za-z]", "", t).upper()
    return [p for p in lazy_pinyin(t) if p.strip()]
def lev(a, b):
    d = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        p, d[0] = d[0], i
        for j, y in enumerate(b, 1):
            p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (x != y))
    return d[-1]
def transcribe(path):
    import librosa
    audio, _ = librosa.load(path, sr=16000, mono=True)  # bypass PyAV decoding
    segs, _ = model().transcribe(audio, language="zh", beam_size=5, initial_prompt="以下是普通话的句子，关于英伟达、黄仁勋、董事会、CEO、H20芯片。", vad_filter=False, condition_on_previous_text=False)
    return "".join(s.text for s in segs).strip()
def check(path, ref):
    hyp = transcribe(path); a, b = norm(ref), norm(hyp)
    err = lev(a, b) / max(1, len(a))
    return hyp, err
if __name__ == "__main__":
    if sys.argv[1] == "--cues":
        script = json.load(open(os.path.join(ROOT, "src/v3/script.json"), encoding="utf-8"))
        rep = {}
        for sc in script["scenes"]:
            for c in sc["cues"]:
                p = os.path.join(ROOT, "out/v3/tts", c["id"] + ".wav")
                if not os.path.exists(p): continue
                hyp, err = check(p, c["text"]); rep[c["id"]] = {"ref": c["text"], "asr": hyp, "pinyin_err": round(err, 3)}
                print(f"{'OK ' if err <= 0.08 else 'BAD'} {err:.2f} {c['id']:12s} {hyp}", flush=True)
        json.dump(rep, open(os.path.join(ROOT, "out/v3/tts/asr_report.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    else:
        for i in range(1, len(sys.argv), 2):
            hyp, err = check(sys.argv[i], sys.argv[i + 1]); print(f"{err:.2f} {os.path.basename(sys.argv[i])}: {hyp}")
