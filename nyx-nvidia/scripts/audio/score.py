"""Nyx Lab cinematic score engine (original, procedurally composed; no samples, no third-party material).
Direction: Cinematic Technology Documentary / Financial Investigation / Premium Editorial.

Usage:
  score.py demo out.wav                    -> 20 s showcase (intro / pulse / build / brand outro)
  score.py spec spec.json out.wav          -> full cue from a section spec:
     {"duration": 85.4, "sections": [{"type": "intro","start":0,"end":12}, {"type":"pulse",...}, {"type":"build",...}, {"type":"climax",...}, {"type":"outro",...}],
      "hits": [12.0, 24.0, ...]}            (hits = scene boundaries; a riser precedes each, an impact lands on it)
"""
import sys, json, math
import numpy as np, soundfile as sf
from scipy.signal import butter, lfilter, fftconvolve

SR = 48000
BPM = 96
BEAT = 60 / BPM
rng = np.random.default_rng(2026)

# ---------- helpers ----------
def note(m): return 440 * 2 ** ((m - 69) / 12)
def sec(n): return int(n * SR)
def lp(x, fc, order=2):
    b, a = butter(order, min(fc, SR / 2 - 100) / (SR / 2)); return lfilter(b, a, x, axis=0)
def hp(x, fc, order=2):
    b, a = butter(order, max(fc, 10) / (SR / 2), btype="high"); return lfilter(b, a, x, axis=0)
def bp(x, lo, hi):
    return hp(lp(x, hi), lo)
def adsr(n, a, d, s, r):
    e = np.zeros(n); na, nd, nr = sec(a), sec(d), sec(r)
    na = min(na, n); e[:na] = np.linspace(0, 1, na) if na else 1
    if na < n:
        nd = min(nd, n - na); e[na:na + nd] = np.linspace(1, s, nd) if nd else s
        e[na + nd:] = s
    if nr and nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e
def pan(mono, p):  # p in [-1, 1], constant power
    th = (p + 1) / 4 * math.pi
    return np.stack([mono * math.cos(th), mono * math.sin(th)], 1)
def place(buf, sig, t):
    i0 = sec(t); n = min(len(sig), len(buf) - i0)
    if n > 0: buf[i0:i0 + n] += sig[:n]
def reverb_ir(seconds, tone=2500, seed=1):
    r = np.random.default_rng(seed); n = sec(seconds)
    ir = r.standard_normal((n, 2)) * np.exp(-np.linspace(0, 7, n))[:, None]
    ir[:sec(0.02)] *= np.linspace(0, 1, sec(0.02))[:, None]
    ir = lp(ir, tone); ir /= np.sqrt((ir ** 2).sum(axis=0))  # unit energy: wet level ~= dry level
    return ir
IR_HALL = reverb_ir(3.2, 2200, 11); IR_ROOM = reverb_ir(0.9, 4500, 12)
def reverb(st, ir, mix):
    wet = np.stack([fftconvolve(st[:, 0], ir[:, 0])[: len(st)], fftconvolve(st[:, 1], ir[:, 1])[: len(st)]], 1)
    return st * (1 - mix) + wet * mix
def pingpong(st, time, fb, mix):
    out = st.copy(); d = sec(time); buf = st.copy()
    for k in range(1, 6):
        g = fb ** k; sh = np.zeros_like(st); sh[d * k:] = buf[: len(buf) - d * k]
        sh = sh[:, ::-1] if k % 2 else sh  # alternate channels
        out += sh * g * mix
    return out
def saturate(x, drive=1.3): return np.tanh(x * drive) / drive
def fm_bell(f, n, ratio=3.01, index=1.4, decay=2.2):
    t = np.arange(n) / SR
    env = np.exp(-t * decay); mod = np.sin(2 * np.pi * f * ratio * t) * index * np.exp(-t * decay * 1.6)
    return np.sin(2 * np.pi * f * t + mod) * env

# ---------- harmony ----------
# bars of (root midi, chord intervals). Two alternating progressions avoid loop fatigue.
PROG_A = [(45, [0, 3, 7, 10]), (41, [0, 4, 7, 11]), (48, [0, 4, 7]), (43, [0, 4, 7, 10])]        # Am7  Fmaj7  C  G7
PROG_B = [(45, [0, 3, 7]), (50, [0, 3, 7]), (40, [0, 4, 7]), (45, [0, 3, 7, 10])]              # Am  Dm  E  Am7
def chord_at(bar):
    prog = PROG_A if (bar // 4) % 2 == 0 else PROG_B
    return prog[bar % 4]

# ---------- layers ----------
def layer_drone(N, t0, t1, gain=1.0):
    out = np.zeros((N, 2)); t = np.arange(sec(t1 - t0)) / SR
    bars = int((t1 - t0) / (BEAT * 4)) + 1
    sig = np.zeros(len(t))
    for b in range(bars):
        root, _ = chord_at(int(t0 / (BEAT * 4)) + b)
        f = note(root - 12)
        i0, i1 = sec(b * BEAT * 4), min(len(t), sec((b + 1) * BEAT * 4))
        if i0 >= len(t): break
        tt = t[i0:i1]
        seg = 0.55 * np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 2.002 * tt) + 0.12 * np.sin(2 * np.pi * f * 3 * tt)
        env = np.ones(i1 - i0); e = min(sec(0.6), (i1 - i0) // 2); env[:e] = np.linspace(0, 1, e); env[-e:] *= np.linspace(1, 0, e)
        sig[i0:i1] += seg * env
    sig *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.09 * t)
    st = pan(sig, 0) * gain
    place(out, st, t0); return out

def layer_pad(N, t0, t1, gain=1.0, open_amount=0.5):
    out = np.zeros((N, 2)); n = sec(t1 - t0); t = np.arange(n) / SR
    bars = int((t1 - t0) / (BEAT * 4)) + 1
    for b in range(bars):
        root, ints = chord_at(int(t0 / (BEAT * 4)) + b)
        i0, i1 = sec(b * BEAT * 4), min(n, sec((b + 1) * BEAT * 4 + 0.8))
        if i0 >= n: break
        m = i1 - i0; tt = np.arange(m) / SR
        chord = np.zeros((m, 2))
        for k, iv in enumerate(ints):
            f = note(root + iv)
            for v, det in enumerate((-0.006, 0.004, 0.011)):
                ph = rng.uniform(0, 1)
                saw = 2 * ((f * (1 + det) * tt + ph) % 1) - 1
                chord += pan(saw, (-0.7 + 0.35 * v) * (1 if k % 2 else -1)) / (len(ints) * 3)
        env = adsr(m, 1.2, 0.5, 0.85, 0.8)
        chord *= env[:, None]
        out[sec(t0) + i0: sec(t0) + i1] += chord[: len(out) - sec(t0) - i0]
    seg = out[sec(t0):sec(t1)]
    # slow filter sweep across the section
    sweep = 350 + 900 * open_amount * (0.5 + 0.5 * np.sin(2 * np.pi * 0.03 * np.arange(len(seg)) / SR - 1.3))
    res = np.zeros_like(seg); ch = SR // 4
    for s in range(0, len(seg), ch):
        res[s:s + ch] = lp(seg[s:s + ch], sweep[min(s, len(seg) - 1)], 2)
    out[sec(t0):sec(t1)] = res
    out = reverb(out, IR_HALL, 0.45)
    return out * gain

def layer_pulse(N, t0, t1, gain=1.0, density=1.0):
    out = np.zeros((N, 2)); step = BEAT / 4; pos = t0; k = 0
    vel_pat = [1, .45, .7, .5, .9, .4, .75, .55, 1, .5, .65, .45, .85, .4, .7, .6]
    while pos < t1:
        bar = int(pos / (BEAT * 4)); root, ints = chord_at(bar)
        pattern = [0, 2, 1, 3, 2, 1, 0, 2] if bar % 2 == 0 else [1, 0, 2, 1, 3, 2, 1, 0]
        iv = ints[pattern[k % 8] % len(ints)]; octv = 12 * (1 + (k // 8) % 2)
        f = note(root + iv + octv)
        if rng.uniform() < density:
            n = sec(step * 0.85); tt = np.arange(n) / SR
            tone = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 2 * tt) + 0.2 * (2 * ((f * tt) % 1) - 1))
            fenv = 900 + 2600 * np.exp(-tt * 18)
            tone = lp(tone * adsr(n, 0.002, 0.12, 0.25, 0.08), 2800) * vel_pat[k % 16] * np.exp(-tt * 6) * 1.6
            place(out, pan(tone, 0.15 * (1 if k % 2 else -1)), pos)
        pos += step; k += 1
    out = pingpong(out, BEAT * 0.75, 0.42, 0.35)
    return reverb(out, IR_ROOM, 0.25) * gain

def layer_blips(N, t0, t1, gain=1.0, rate=0.7):
    out = np.zeros((N, 2)); pos = t0
    while pos < t1:
        pos += rng.exponential(1 / rate)
        if pos >= t1: break
        f = rng.choice([note(88), note(91), note(93), note(95), note(100)])
        n = sec(0.35); tt = np.arange(n) / SR
        s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 14) * 0.5 + 0.2 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt * 30)
        place(out, pan(s, rng.uniform(-0.8, 0.8)), pos)
    out = pingpong(out, BEAT * 0.5, 0.5, 0.5)
    return reverb(out, IR_HALL, 0.5) * gain

def layer_kick(N, t0, t1, gain=1.0, every=1):
    out = np.zeros((N, 2)); pos = t0
    while pos < t1:
        n = sec(0.4); tt = np.arange(n) / SR
        k = np.sin(2 * np.pi * (46 + 70 * np.exp(-tt * 28)) * tt) * np.exp(-tt * 8)
        place(out, pan(k, 0), pos); pos += BEAT * every
    return out * gain

def layer_tension(N, t0, t1, gain=1.0):
    """string-like minor-second ostinato on beats 1 and 3 + rising high string line"""
    out = np.zeros((N, 2)); pos = t0; k = 0
    while pos < t1:
        bar = int(pos / (BEAT * 4)); root, _ = chord_at(bar)
        f = note(root + 12 + (1 if k % 2 else 0))
        n = sec(BEAT * 1.2); tt = np.arange(n) / SR
        s = sum(2 * ((f * (1 + d) * tt) % 1) - 1 for d in (-0.004, 0, 0.005)) / 3
        s = lp(s, 1500) * adsr(n, 0.05, 0.3, 0.5, 0.4)
        place(out, pan(s, -0.3 if k % 2 else 0.3), pos); pos += BEAT * 2; k += 1
    # slow rising line over the whole section
    n = sec(t1 - t0); tt = np.arange(n) / SR
    f = note(76) * 2 ** (tt / (t1 - t0) * 7 / 12)
    line = np.sin(2 * np.pi * np.cumsum(f) / SR) * adsr(n, 2.0, 0.1, 1, 1.0) * 0.25
    place(out, pan(line, 0.0), t0)
    return reverb(out, IR_HALL, 0.4) * gain

def riser(N, t_hit, length=2.0, gain=1.0):
    out = np.zeros((N, 2)); n = sec(length); tt = np.arange(n) / SR
    noise = rng.standard_normal((n, 2)) * (tt / length)[:, None] ** 2.5
    noise = bp(noise, 300 + 2500 * (tt[-1] / length), 6000)
    f = note(57) * 2 ** (tt / length)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * (tt / length) ** 2 * 0.5
    place(out, noise * 0.5 + pan(tone, 0), t_hit - length)
    return out * gain

def impact(N, t_hit, gain=1.0, size=1.0):
    out = np.zeros((N, 2)); n = sec(2.5); tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (38 + 40 * np.exp(-tt * 20)) * tt) * np.exp(-tt * 3.2)
    crack = lp(rng.standard_normal(n), 3500) * np.exp(-tt * 40) * 0.6
    metal = fm_bell(note(45), n, 2.76, 2.0, 2.5) * 0.35
    s = pan(boom * 1.0 + crack + metal, 0)
    s = reverb(s, IR_HALL, 0.35)
    place(out, s * size, t_hit)
    return out * gain

def brand_motif(N, t0, gain=1.0):
    """Nyx signature: E5 - B4 - E6 bell motif with sub drop (the audio logo)"""
    out = np.zeros((N, 2))
    for i, (m, dt) in enumerate(((76, 0.0), (71, 0.42), (88, 0.84))):
        n = sec(4.0); s = fm_bell(note(m), n, 3.01, 1.3, 1.1) * (0.8 if i < 2 else 0.6)
        place(out, pan(s, -0.25 + 0.25 * i), t0 + dt)
    n = sec(3.0); tt = np.arange(n) / SR
    sub = np.sin(2 * np.pi * (note(40 - 12) * np.exp(-tt * 0.15)) * tt) * np.exp(-tt * 1.3) * 0.8
    place(out, pan(sub, 0), t0 + 0.84)
    return reverb(out, IR_HALL, 0.5) * gain

# ---------- arrangement ----------
def render(spec):
    dur = spec["duration"]; N = sec(dur) + sec(4)
    mix = np.zeros((N, 2))
    for s in spec["sections"]:
        a, b, ty = s["start"], s["end"], s["type"]
        if ty == "intro":
            mix += layer_drone(N, a, b, 0.5) + layer_pad(N, a, b, 0.55, open_amount=0.25)
            mix += layer_blips(N, a + 1.5, b, 0.45, rate=0.35)
        elif ty == "pulse":
            mix += layer_drone(N, a, b, 0.42) + layer_pad(N, a, b, 0.5, open_amount=0.55)
            mix += layer_pulse(N, a, b, 0.4, density=0.85) + layer_blips(N, a, b, 0.55, rate=0.6)
            mix += layer_kick(N, a, b, 0.6, every=2)
        elif ty == "build":
            mix += layer_drone(N, a, b, 0.5) + layer_pad(N, a, b, 0.6, open_amount=0.8)
            mix += layer_pulse(N, a, b, 0.48, density=1.0) + layer_kick(N, a, b, 0.8, every=1)
            mix += layer_tension(N, a, b, 0.32) + layer_blips(N, a, b, 0.4, rate=0.4)
        elif ty == "climax":
            mix += layer_drone(N, a, b, 0.55) + layer_pad(N, a, b, 0.65, open_amount=1.0)
            mix += layer_pulse(N, a, b, 0.33, density=0.7) + layer_kick(N, a, b, 0.7, every=2)
            mix += layer_tension(N, a, b, 0.28)
        elif ty == "outro":
            mix += layer_drone(N, a, b, 0.4) + layer_pad(N, a, b, 0.45, open_amount=0.3)
            mix += brand_motif(N, a + spec.get("brand_offset", 0.6), 0.32)
    for h in spec.get("hits", []):
        mix += riser(N, h, 1.8, 0.7) + impact(N, h, 0.5, size=0.9)
    mix = mix[: sec(dur)]
    # section crossfades are built into layers; global envelope
    t = np.arange(len(mix)) / SR
    mix *= np.clip(t / 1.5, 0, 1)[:, None] * np.clip((dur - t) / 2.5, 0, 1)[:, None]
    mix = hp(mix, 28)
    mix /= max(1e-6, np.max(np.abs(mix))) / 0.85
    mix = saturate(mix, 1.05)
    mix /= max(1e-6, np.max(np.abs(mix))) / 0.7
    return mix.astype(np.float32)

if __name__ == "__main__":
    if sys.argv[1] == "demo":
        spec = {"duration": 20.0,
                "sections": [{"type": "intro", "start": 0, "end": 5.0}, {"type": "pulse", "start": 5.0, "end": 12.0},
                             {"type": "build", "start": 12.0, "end": 16.5}, {"type": "outro", "start": 16.5, "end": 20.0}],
                "hits": [5.0, 12.0, 16.5], "brand_offset": 0.4}
        out = sys.argv[2]
    else:
        spec = json.load(open(sys.argv[2])); out = sys.argv[3]
    audio = render(spec)
    sf.write(out, audio, SR, subtype="PCM_24")
    print("score", spec["duration"], "s ->", out)
