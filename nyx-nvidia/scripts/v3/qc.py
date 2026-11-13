"""Post-render quality checks on the final MP4. Writes out/v3/qc_report.json."""
import json, os, subprocess, sys, re
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MP4 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "out/nyx-nvidia-directors-cut-v3.mp4")
REPORT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "out/v3/qc_report.json")
tl = json.load(open(os.path.join(ROOT, "src/v3/timeline.json"), encoding="utf-8"))
rep = {}
def run(args): return subprocess.run(args, capture_output=True, text=True)
p = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", MP4]).stdout)
v = [s for s in p["streams"] if s["codec_type"] == "video"][0]; a = [s for s in p["streams"] if s["codec_type"] == "audio"][0]
rep["video"] = {k: v.get(k) for k in ("codec_name", "width", "height", "r_frame_rate", "nb_frames", "duration", "pix_fmt", "profile")}
rep["audio"] = {k: a.get(k) for k in ("codec_name", "sample_rate", "channels", "channel_layout", "bit_rate", "duration")}
rep["format"] = {"duration": p["format"]["duration"], "size_mb": round(int(p["format"]["size"]) / 1e6, 2), "expected_duration": round(tl["totalFrames"] / tl["fps"], 3)}
e = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MP4, "-vn", "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"]).stderr; t = e[e.rfind("Summary:"):]
rep["loudness"] = {"integrated_lufs": float(t.split("I:")[1].split("LUFS")[0]), "lra_lu": float(t.split("LRA:")[1].split("LU")[0]), "true_peak_dbtp": float(t.split("Peak:")[1].split("dBFS")[0])}
s = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MP4, "-vn", "-af", "silencedetect=noise=-50dB:d=1.0", "-f", "null", "-"]).stderr
rep["silences_over_1s_below_-50dB"] = re.findall(r"silence_start: ([\d.]+)", s)
b = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MP4, "-an", "-vf", "blackdetect=d=0.5:pix_th=0.02", "-f", "null", "-"]).stderr
rep["black_segments_over_0.5s"] = re.findall(r"black_start:([\d.]+)", b)
# decode audio once, then check every subtitle window: is the right sentence audible in the final mix at that time?
wav = os.path.join(ROOT, "out/v3/qc_audio.wav")
run(["ffmpeg", "-v", "error", "-y", "-i", MP4, "-vn", "-ac", "2", "-ar", "16000", wav])
import soundfile as sf
x, sr = sf.read(wav, dtype="float32")
rep["channels_rms_db"] = [round(float(20 * np.log10(np.sqrt(np.mean(x[:, i] ** 2)) + 1e-12)), 2) for i in range(2)]
rep["lr_correlation"] = round(float(np.corrcoef(x[:, 0], x[:, 1])[0, 1]), 3)
for name, (t0, t1) in {"start": (0, 5), "middle": (len(x) / sr / 2 - 2.5, len(x) / sr / 2 + 2.5), "end": (len(x) / sr - 5, len(x) / sr)}.items():
    seg = x[int(t0 * sr):int(t1 * sr)]; rep.setdefault("segment_rms_db", {})[name] = round(float(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)), 1)
import asr_check as A
mono = x.mean(1); bad = []; rows = []
for c in tl["cues"]:
    seg = mono[max(0, int((c["start"] - 0.2) * sr)):int((c["end"] + 0.3) * sr)]
    segs, _ = A.model().transcribe(seg, language="zh", beam_size=5, initial_prompt="以下是普通话的句子，关于英伟达、黄仁勋、董事会、CEO、H20芯片。", condition_on_previous_text=False)
    hyp = "".join(s_.text for s_ in segs).strip(); ra, rb = A.norm(c["text"]), A.norm(hyp); err = A.lev(ra, rb) / max(1, len(ra))
    rows.append({"id": c["id"], "start": c["start"], "subtitle": c["text"], "heard_in_final_mix": hyp, "pinyin_err": round(err, 3)})
    if err > 0.1: bad.append(c["id"])
    print(f"{'OK ' if err <= 0.1 else 'BAD'} {c['start']:7.2f}s {c['id']:12s} {hyp}", flush=True)
rep["subtitle_vs_audio"] = {"cues": len(rows), "mismatches": bad, "rows": rows}
json.dump(rep, open(REPORT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps({k: rep[k] for k in rep if k != "subtitle_vs_audio"}, ensure_ascii=False, indent=1)); print("mismatches:", bad)
