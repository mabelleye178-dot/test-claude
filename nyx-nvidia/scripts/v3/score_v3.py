"""V3 full-length score, arranged scene by scene from src/v3/timeline.json.
Original procedural composition built on scripts/audio/score.py (the 20 s demo engine). No samples, no third-party material.
Output: out/v3/audio/music_raw.wav (48 kHz stereo, 24-bit, un-ducked, includes restrained SFX)
"""
import sys, os, json, math
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "audio"))
import score as S
from score import SR, BEAT, sec, note, pan, place, reverb, IR_HALL, IR_ROOM, lp, hp

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
tl = json.load(open(os.path.join(ROOT, "src/v3/timeline.json"), encoding="utf-8"))
FPS, T = tl["fps"], tl["transition"]
DUR = tl["totalFrames"] / FPS
N = sec(DUR) + sec(4)
cue = {c["id"]: c for c in tl["cues"]}
sc = {s["id"]: s for s in tl["scenes"]}
order = [s["id"] for s in tl["scenes"]]
bounds = {}  # scene id -> (start_sec, end_sec) with boundaries in the middle of each transition
for i, sid in enumerate(order):
    a = 0.0 if i == 0 else (sc[sid]["start"] + T / 2) / FPS
    b = DUR if i == len(order) - 1 else (sc[order[i + 1]]["start"] + T / 2) / FPS
    bounds[sid] = (a, b)
rng = np.random.default_rng(58)

# ---------- extra layers ----------
def layer_bass(t0, t1, gain=1.0):
    """syncopated low pulse: the 'investigation' drive"""
    out = np.zeros((N, 2)); step = BEAT / 2; pos = t0; k = 0
    pat = [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1]
    while pos < t1 - step:
        if pat[k % 16]:
            root, _ = S.chord_at(int(pos / (BEAT * 4)))
            f = note(root - 12); n = sec(step * 1.6); tt = np.arange(n) / SR
            tone = (np.sin(2 * np.pi * f * tt) + 0.5 * (2 * ((f * tt) % 1) - 1)) * np.exp(-tt * 5.5)
            tone = lp(tone, 320) * np.minimum(1, tt / 0.004)
            place(out, pan(tone, 0), pos)
        pos += step; k += 1
    return out * gain

def layer_keys(notes, gain=1.0):
    """soft felt-piano voice for the melodic line and motif fragments. notes = [(time, midi, vel)]"""
    out = np.zeros((N, 2))
    for i, (t, m, v) in enumerate(notes):
        f = note(m); n = sec(3.2); tt = np.arange(n) / SR
        tone = (np.sin(2 * np.pi * f * tt) + 0.42 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt * 3) + 0.18 * np.sin(2 * np.pi * 3.01 * f * tt) * np.exp(-tt * 6))
        tone *= np.exp(-tt * 1.7) * np.minimum(1, tt / 0.006) * v
        place(out, pan(tone, -0.2 + 0.4 * ((i * 37) % 10) / 10), t)
    return reverb(out, IR_HALL, 0.42) * gain

def tick(t, f=1900.0, gain=1.0, p=0.0, decay=55.0):
    out = np.zeros((N, 2)); n = sec(0.14); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * decay) + 0.3 * np.sin(2 * np.pi * f * 2.01 * tt) * np.exp(-tt * decay * 2)
    place(out, pan(s * np.minimum(1, tt / 0.001), p), t); return out * gain

def thud(t, gain=1.0):
    out = np.zeros((N, 2)); n = sec(0.7); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * (52 + 50 * np.exp(-tt * 22)) * tt) * np.exp(-tt * 6.5)
    place(out, pan(s, 0), t); return out * gain

def section(a, b, parts, fade=0.35):
    """sum layers, then apply a soft in/out envelope over [a, b] (tails of reverb/delay ring slightly past b)"""
    m = sum(parts)
    t = np.arange(N) / SR
    env = np.clip((t - (a - fade)) / (2 * fade), 0, 1) * np.clip(((b + fade) - t) / (2 * fade), 0, 1)
    env = np.sin(env * np.pi / 2) ** 2
    return m * env[:, None]

mix = np.zeros((N, 2))
c = lambda k, off=0.0: cue[k]["start"] + off
fr = lambda frames: frames / FPS

# ---------- 01 hook: deep atmosphere, suspense ----------
a, b = bounds["hook"]
mix += section(a, b, [S.layer_drone(N, a, b, 0.55), S.layer_pad(N, a, b, 0.5, open_amount=0.2), S.layer_blips(N, c("hook.who"), b, 0.4, rate=0.3)])
mix += S.impact(N, 0.12, 0.42, size=0.8)
for i in range(7): mix += tick(0.18 + i * 0.15, 1300 * 2 ** (i / 12), 0.05, -0.4 + i * 0.13)      # count-up
mix += layer_keys([(c("hook.q", 0.2), 76, 0.5), (c("hook.q", 1.1), 71, 0.4)], 0.5)

# ---------- 02 ownership: refined electronic pulse + data ticks ----------
a, b = bounds["ownership"]
mix += section(a, b, [S.layer_drone(N, a, b, 0.42), S.layer_pad(N, a, b, 0.5, open_amount=0.55), S.layer_pulse(N, a + 1.0, b, 0.36, density=0.8), S.layer_blips(N, a, b, 0.5, rate=0.5), S.layer_kick(N, a + 1.0, b, 0.55, every=2)])
for k, f0 in (("own.huang", 2100), ("own.funds", 1700), ("own.insiders", 1500), ("own.vote2", 2100)): mix += tick(c(k, 0.05), f0, 0.09, 0.2)
mix += tick(c("own.funds", fr(8)), 1800, 0.08, -0.2) + tick(c("own.vote1", fr(8)), 1400, 0.08, 0)

# ---------- 03 board: more space and tension ----------
a, b = bounds["board"]
mix += section(a, b, [S.layer_drone(N, a, b, 0.46), S.layer_pad(N, a, b, 0.62, open_amount=0.85), S.layer_pulse(N, a, b, 0.26, density=0.5), S.layer_tension(N, a, b, 0.16), S.layer_kick(N, a, b, 0.5, every=2)])
for i in range(10): mix += tick(c("board.elect", fr(i * 5)), 1500 if i % 2 else 1750, 0.06, -0.5 + i * 0.11)
mix += tick(c("board.expand", fr(4)), 2350, 0.1, 0.3) + thud(c("board.one", 0.1), 0.3)

# ---------- 04 power: the music advances as the structure is explained ----------
a, b = bounds["power"]; mid = c("pow.ceo")
mix += section(a, mid, [S.layer_drone(N, a, mid, 0.46), S.layer_pad(N, a, mid, 0.55, open_amount=0.6), S.layer_pulse(N, a, mid, 0.4, density=0.9), S.layer_kick(N, a, mid, 0.55, every=2), S.layer_tension(N, a, mid, 0.14)])
mix += section(mid, b, [S.layer_drone(N, mid, b, 0.5), S.layer_pad(N, mid, b, 0.62, open_amount=0.95), S.layer_pulse(N, mid, b, 0.46, density=1.0), S.layer_kick(N, mid, b, 0.75, every=1), S.layer_tension(N, mid, b, 0.26), layer_bass(mid, b, 0.3)])
for k, f0 in (("pow.sh", 1500), ("pow.board", 1700), ("pow.ceo", 1900)): mix += tick(c(k, 0.05), f0, 0.09, -0.2)
mix += tick(c("pow.ceo", fr(26)), 2100, 0.08, 0.2)
for k in range(3): mix += tick(c("pow.back", fr(10 + k * 14)), 2300 - k * 200, 0.07, 0.4)

# ---------- 05 timeline: rhythm change, low-frequency drive ----------
a, b = bounds["timeline"]
mix += section(a, b, [S.layer_drone(N, a, b, 0.5), S.layer_pad(N, a, b, 0.45, open_amount=0.4), layer_bass(a, b, 0.5), S.layer_kick(N, a, b, 0.6, every=1), S.layer_pulse(N, a, b, 0.22, density=0.45), S.layer_tension(N, a, b, 0.2)])
for k in ("tl.bg", "tl.oct", "tl.nov", "tl.alleg", "tl.nov8"): mix += tick(c(k, 0.02), 1250 if k == "tl.alleg" else 1650, 0.085, -0.3)

# ---------- 06 turning point: the drop — impact, then almost nothing ----------
a, b = bounds["turning"]
mix += section(a, b, [S.layer_drone(N, a, b, 0.6), S.layer_pad(N, a, b, 0.3, open_amount=0.15), S.layer_kick(N, a + 0.4, b, 0.5, every=4)])
mix += thud(c("turn.resign", fr(34)), 0.42)
mix += layer_keys([(c("turn.kress", fr(6)), 69, 0.55), (c("turn.chair", 0.1), 72, 0.5), (c("turn.chair", 0.9), 76, 0.45)], 0.55)
mix += tick(c("turn.chair", fr(30)), 1500, 0.06, 0.2)

# ---------- 07 insight: sparse — let the idea speak ----------
a, b = bounds["insight"]
mel = [76, 72, 69, 71, 72, 76, 74, 72, 69, 71]
notes = []; t = a + 0.5; i = 0
while t < b - 1.0: notes.append((t, mel[i % len(mel)], 0.5 if i % 4 else 0.62)); t += BEAT * 2; i += 1
mix += section(a, b, [S.layer_drone(N, a, b, 0.4), S.layer_pad(N, a, b, 0.5, open_amount=0.35)]) + layer_keys(notes, 0.5)
mix += thud(c("ins.neq", fr(16)), 0.22)

# ---------- 08 conclusion: resolve, then the Nyx Lab signature ----------
a, b = bounds["conclusion"]
tb = c("end.brand")
mix += section(a, b, [S.layer_drone(N, a, b, 0.42), S.layer_pad(N, a, b, 0.55, open_amount=0.3)], fade=0.5)
mix += layer_keys([(c("end.quote", 0.2), 69, 0.5), (c("end.quote", 0.2 + BEAT * 2), 72, 0.45), (c("end.quote", 0.2 + BEAT * 4), 76, 0.5), (c("end.note", 0.3), 71, 0.4)], 0.5)
mix += S.brand_motif(N, cue["end.brand"]["end"] + 0.25, 0.34)

# ---------- transitions: restrained riser + impact on each scene change ----------
hit_cfg = {"ownership": (0.6, 0.42), "board": (0.6, 0.42), "power": (0.65, 0.45), "timeline": (0.75, 0.5), "turning": (0.9, 0.7), "insight": (0.3, 0.25), "conclusion": (0.35, 0.3)}
for sid, (rg, ig) in hit_cfg.items():
    h = bounds[sid][0]
    mix += S.riser(N, h, 1.7, rg) + S.impact(N, h, ig, size=0.9)

mix = mix[: sec(DUR)]
t = np.arange(len(mix)) / SR
mix *= (np.clip(t / 1.2, 0, 1) * np.clip((DUR - t) / 2.2, 0, 1))[:, None]
mix = hp(mix, 28)
mix /= max(1e-6, np.max(np.abs(mix))) / 0.85
mix = S.saturate(mix, 1.05); mix /= max(1e-6, np.max(np.abs(mix))) / 0.8
os.makedirs(os.path.join(ROOT, "out/v3/audio"), exist_ok=True)
sf.write(os.path.join(ROOT, "out/v3/audio/music_raw.wav"), mix.astype(np.float32), SR, subtype="PCM_24")
for sid in order:
    a, b = bounds[sid]; seg = mix[sec(a):sec(b)]
    print(f"  {sid:11s} {a:6.1f}-{b:6.1f}s  rms {20*np.log10(np.sqrt(np.mean(seg**2))+1e-9):6.1f} dB  corr {np.corrcoef(seg[:,0],seg[:,1])[0,1]:.2f}")
print("score ->", round(DUR, 2), "s")
