"""Single source of truth for V3 timing.
script.json (text, scene order, pauses) + out/v3/tts/durations.json (real clip lengths) -> src/v3/timeline.json
Every consumer (Remotion scenes, subtitles, SRT, score spec, mix) reads timeline.json. Missing clips get an estimate so visuals can be previewed first.
"""
import json, math, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
script = json.load(open(os.path.join(ROOT, "src/v3/script.json"), encoding="utf-8"))
dpath = os.path.join(ROOT, "out/v3/tts/durations.json")
durs = json.load(open(dpath, encoding="utf-8")) if os.path.exists(dpath) else {}
FPS = script["fps"]; T = script["transition"]; GAP = script["defaultGap"]
scenes, cues = [], []
start = 0  # scene start frame (global)
estimated = 0
for si, sc in enumerate(script["scenes"]):
    t = start / FPS + sc.get("lead", 0.5)
    for c in sc["cues"]:
        if c["id"] in durs: d = durs[c["id"]]["duration"]
        else: d = 0.3 + 0.215 * len(c["text"]); estimated += 1
        cues.append({"id": c["id"], "scene": sc["id"], "text": c["text"], "start": round(t, 3), "end": round(t + d, 3)})
        t += d + c.get("gap", GAP)
    last_end = cues[-1]["end"]
    is_last = si == len(script["scenes"]) - 1
    end_frame = math.ceil((last_end + sc.get("tail", 0.6)) * FPS)
    d_frames = end_frame - start + (0 if is_last else T)
    scenes.append({"id": sc["id"], "start": start, "d": d_frames})
    start = start + d_frames - T
total = scenes[-1]["start"] + scenes[-1]["d"]
out = {"fps": FPS, "transition": T, "totalFrames": total, "estimatedCues": estimated, "scenes": scenes, "cues": cues}
json.dump(out, open(os.path.join(ROOT, "src/v3/timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"timeline: {total} frames = {total/FPS:.2f}s, {len(cues)} cues ({estimated} estimated)")
for s in scenes: print(f"  {s['id']:11s} start {s['start']/FPS:6.2f}s  len {s['d']/FPS:5.2f}s")
