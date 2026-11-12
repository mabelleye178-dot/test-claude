"""Retime cues to real speech, stretch scenes if needed, build voice + ducked music mix.
Inputs : src/subtitles.plan.json (planned cue times), out/tts/durations.json, src/Video.tsx scene plan (SCENE_PLAN below)
Outputs: src/subtitles.json (real times), src/timing.json (scene durations), public/audio/mix.wav, out/audio/{voice,music}.wav
"""
import json, os, subprocess, math
import numpy as np, soundfile as sf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FPS = 30; T = 20; SR = 48000
SCENE_PLAN = [("hook", 190), ("title", 220), ("ownership", 370), ("board", 320), ("power", 330), ("timeline", 560), ("verdict", 230), ("outro", 170)]
GAP = 0.25          # min silence between sentences
TAIL = 0.45         # silence before a scene's transition starts

plan = json.load(open(os.path.join(ROOT, "src/subtitles.plan.json"), encoding="utf-8"))
durs = json.load(open(os.path.join(ROOT, "out/tts/durations.json"), encoding="utf-8"))["cues"]
assert len(plan) == len(durs)

# original scene windows
starts = []; s = 0
for _, d in SCENE_PLAN:
    starts.append(s); s += d - T
orig_total = s + T

offset = 0.0; prev_end = -10.0
new_scenes = []; cues = []
for i, (sid, d) in enumerate(SCENE_PLAN):
    s0 = starts[i] / FPS
    # exclusive window: a cue belongs to the scene that is fully visible when it starts (overlap goes to the next scene)
    s1 = (starts[i + 1] / FPS) if i + 1 < len(SCENE_PLAN) else 1e9
    new_start = s0 + offset
    mine = [(j, c) for j, c in enumerate(plan) if s0 <= c["start"] < s1]
    last_end = new_start
    for j, c in mine:
        st = max(c["start"] + offset, prev_end + GAP)
        en = st + durs[j]["duration"]
        cues.append({"start": round(st, 3), "end": round(en, 3), "text": c["text"], "scene": sid, "offsetFromScene": round(st - new_start, 3)})
        prev_end = en; last_end = en
    need_frames = math.ceil((last_end + TAIL - new_start) * FPS) + T
    new_d = max(d, need_frames)
    new_scenes.append({"id": sid, "d": new_d, "orig": d, "start": round(new_start, 3)})
    offset += (new_d - d) / FPS

total_frames = sum(sc["d"] for sc in new_scenes) - (len(new_scenes) - 1) * T
total = total_frames / FPS
json.dump(cues, open(os.path.join(ROOT, "src/subtitles.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump({"fps": FPS, "transition": T, "totalFrames": total_frames, "scenes": [{"id": sc["id"], "d": sc["d"]} for sc in new_scenes]},
          open(os.path.join(ROOT, "src/timing.json"), "w", encoding="utf-8"), indent=2)
print("scenes:", [(sc["id"], sc["orig"], sc["d"]) for sc in new_scenes])
print(f"total {orig_total} -> {total_frames} frames ({total:.2f}s)")

# ---- voice track
N = int(total * SR) + SR
voice = np.zeros(N, dtype=np.float32)
for j, c in enumerate(cues):
    x, sr = sf.read(durs[j]["file"], dtype="float32"); assert sr == SR
    i0 = int(c["start"] * SR); voice[i0:i0 + len(x)] += x
voice = voice[: int(total * SR)]
# gentle de-ess/presence shaping via simple high-shelf is skipped; keep natural. Level: RMS ~ -20 dBFS
rms = np.sqrt(np.mean(voice[np.abs(voice) > 1e-4] ** 2)) if np.any(np.abs(voice) > 1e-4) else 1
voice *= min(10 ** (-18 / 20) / rms, 3.0)
voice = np.clip(voice, -0.98, 0.98)
os.makedirs(os.path.join(ROOT, "out/audio"), exist_ok=True)
sf.write(os.path.join(ROOT, "out/audio/voice.wav"), np.stack([voice, voice], 1), SR)

# ---- music (scene boundaries = starts of transitions)
bounds = []; acc = 0
for sc in new_scenes[:-1]:
    acc += sc["d"] - T; bounds.append(acc / FPS)
json.dump(bounds, open(os.path.join(ROOT, "out/audio/bounds.json"), "w"))
subprocess.run(["python3", os.path.join(ROOT, "scripts/audio/synth_music.py"), str(total), os.path.join(ROOT, "out/audio/music.wav"), os.path.join(ROOT, "out/audio/bounds.json")], check=True)
music, _ = sf.read(os.path.join(ROOT, "out/audio/music.wav"), dtype="float32")
music = music[: len(voice)]
mrms = np.sqrt(np.mean(music ** 2)); music *= 10 ** (-27 / 20) / mrms   # bed at ~-27 dBFS RMS before ducking

# ---- ducking: gain curve from cue windows with smooth ramps, plus envelope follower safety
duck = np.ones(len(voice), dtype=np.float32)
DUCK_DB = -11; ramp_in = int(0.18 * SR); ramp_out = int(0.45 * SR)
g = 10 ** (DUCK_DB / 20)
for c in cues:
    a = int((c["start"] - 0.12) * SR); b = int((c["end"] + 0.25) * SR)
    a = max(a, 0); b = min(b, len(duck))
    duck[a:b] = np.minimum(duck[a:b], g)
# smooth the step curve (attack/release) with one-pole filters
out = np.empty_like(duck); y = 1.0
ka = 1 - math.exp(-1 / ramp_in); kr = 1 - math.exp(-1 / ramp_out)
for i in range(len(duck)):
    target = duck[i]; y += (ka if target < y else kr) * (target - y); out[i] = y
music *= out[:, None]
mix = music + np.stack([voice, voice], 1)
peak = np.max(np.abs(mix)); mix = mix / peak * 0.95 if peak > 0.95 else mix
sf.write(os.path.join(ROOT, "out/audio/mix_raw.wav"), mix, SR)
# broadcast loudness normalisation
os.makedirs(os.path.join(ROOT, "public/audio"), exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "out/audio/mix_raw.wav"), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", os.path.join(ROOT, "public/audio/mix.wav")], check=True)
print("mix ->", os.path.join(ROOT, "public/audio/mix.wav"), f"{len(mix)/SR:.2f}s")
