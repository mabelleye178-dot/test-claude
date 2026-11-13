"""Collect V3 deliverables into deliverables/v3/ (SRT + timeline from the single timeline source, stems, video)."""
import json, os, shutil, subprocess
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
D = os.path.join(ROOT, "deliverables/v3"); os.makedirs(D, exist_ok=True)
tl = json.load(open(os.path.join(ROOT, "src/v3/timeline.json"), encoding="utf-8"))
def ts(s):
    ms = int(round(s * 1000)); return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"
srt = "\n".join(f"{i+1}\n{ts(max(0, c['start']-0.05))} --> {ts(c['end']+0.15)}\n{c['text']}\n" for i, c in enumerate(tl["cues"]))
open(os.path.join(D, "subtitles-final.srt"), "w", encoding="utf-8").write(srt)
json.dump(tl, open(os.path.join(D, "timeline-final.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for src, dst in (("out/v3/audio/voice_final.wav", "voice-final.wav"), ("out/v3/audio/music_final.wav", "music-final.wav")):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, src), "-c:a", "pcm_s16le", "-ar", "48000", os.path.join(D, dst)], check=True)
mp4 = os.path.join(ROOT, "out/nyx-nvidia-directors-cut-v3.mp4")
if os.path.exists(mp4): shutil.copy(mp4, os.path.join(D, "nyx-nvidia-directors-cut-v3.mp4"))
os.makedirs(os.path.join(ROOT, "assets/v3/tts"), exist_ok=True)   # keep the narration clips so the mix can be rebuilt without re-running TTS
for c in tl["cues"]: shutil.copy(os.path.join(ROOT, "out/v3/tts", c["id"] + ".wav"), os.path.join(ROOT, "assets/v3/tts", c["id"] + ".wav"))
shutil.copy(os.path.join(ROOT, "out/v3/tts/durations.json"), os.path.join(ROOT, "assets/v3/tts/durations.json"))
shutil.copy(os.path.join(ROOT, "out/v3/tts/ref_seed11.wav"), os.path.join(ROOT, "assets/v3/tts/_narrator_reference.wav"))
print("exported:", sorted(os.listdir(D)))
