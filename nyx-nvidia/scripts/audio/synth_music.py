"""Procedurally generated, original score: dark tech-suspense bed (no samples, no third-party material).
License: created in-project; free to use with the video.
Usage: synth_music.py <duration_sec> <out.wav> [boundaries.json]
"""
import sys, json, numpy as np, soundfile as sf
from scipy.signal import butter, lfilter

SR = 48000
dur = float(sys.argv[1]); out = sys.argv[2]
bounds = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else []
N = int(dur * SR); t = np.arange(N) / SR
rng = np.random.default_rng(7)

def lp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2)); return lfilter(b, a, x)
def hp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), btype="high"); return lfilter(b, a, x)
def env_ad(n, a, d):
    e = np.ones(n); na = int(a * SR); nd = int(d * SR)
    e[:na] = np.linspace(0, 1, na) if na else 1
    tail = np.exp(-np.linspace(0, 6, nd)) if nd else 1
    if nd: e[-nd:] *= tail
    return e
def note(f): return 440 * 2 ** ((f - 69) / 12)

mix = np.zeros(N)

# 1) sub drone A1 with slow beating detune
drone = 0.5 * np.sin(2 * np.pi * note(33) * t) + 0.3 * np.sin(2 * np.pi * (note(33) * 1.003) * t) + 0.2 * np.sin(2 * np.pi * note(45) * t)
drone *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t)
mix += 0.22 * drone

# 2) minor pad: A2 C3 E3 G3 detuned saw, low-passed with slow sweep
def saw(f): return 2 * ((f * t) % 1) - 1
pad = sum(0.25 * (saw(note(m)) + saw(note(m) * 1.004)) for m in (45, 48, 52, 55))
fc = 300 + 250 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.05 * t - 1.2))
# piecewise filter sweep (chunked)
padf = np.zeros(N); chunk = SR // 2
for s in range(0, N, chunk):
    seg = pad[s:s + chunk]; padf[s:s + chunk] = lp(seg, fc[min(s, N - 1)], 2)
mix += 0.10 * padf * (0.6 + 0.4 * np.clip(t / 6, 0, 1))

# 3) pulse ostinato: 92 BPM, 8th notes, pattern over A minor, enters at 6 s, fades in
bpm = 92; step = 60 / bpm / 2
pattern = [57, 60, 64, 67, 64, 60, 57, 55]
k = 0; pos = 6.0
pulse = np.zeros(N)
while pos < dur - 3:
    f = note(pattern[k % len(pattern)]); n = int(step * SR * 0.9); i0 = int(pos * SR)
    if i0 + n < N:
        tone = np.sin(2 * np.pi * f * np.arange(n) / SR) * (1 + 0.3 * np.sin(2 * np.pi * f * 2 * np.arange(n) / SR))
        pulse[i0:i0 + n] += tone * env_ad(n, 0.004, 0.18)
    pos += step; k += 1
pulse = lp(pulse, 1800)
pulse_gain = np.clip((t - 6) / 10, 0, 1) * 0.11
mix += pulse * pulse_gain

# 4) heartbeat kick every 2 beats
beat = 60 / bpm; pos = 2.0
while pos < dur - 2:
    n = int(0.35 * SR); i0 = int(pos * SR)
    if i0 + n < N:
        ph = 2 * np.pi * (55 * np.arange(n) / SR - 20 * (np.arange(n) / SR) ** 2 * 0)
        kick = np.sin(2 * np.pi * (48 + 60 * np.exp(-np.arange(n) / SR * 25)) * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 9)
        mix[i0:i0 + n] += 0.28 * kick
    pos += beat * 2

# 5) ticking hats: filtered noise on off-beats, very quiet
pos = 6.0
while pos < dur - 3:
    n = int(0.03 * SR); i0 = int(pos * SR)
    if i0 + n < N:
        mix[i0:i0 + n] += 0.035 * hp(rng.standard_normal(n), 6000) * np.exp(-np.arange(n) / SR * 150)
    pos += beat / 2

# 6) risers before each scene boundary (noise swell 1.6 s) + soft impact at boundary
for b in bounds:
    n = int(1.6 * SR); i0 = int(b * SR) - n
    if i0 > 0 and i0 + n < N:
        sw = lp(rng.standard_normal(n), 2500) * (np.linspace(0, 1, n) ** 2.2)
        mix[i0:i0 + n] += 0.12 * sw
        m = int(0.6 * SR); j0 = int(b * SR)
        if j0 + m < N:
            mix[j0:j0 + m] += 0.25 * np.sin(2 * np.pi * 40 * np.arange(m) / SR) * np.exp(-np.arange(m) / SR * 7)

# master: gentle fades, soft clip, stereo widen
fade_in = np.clip(t / 2.5, 0, 1); fade_out = np.clip((dur - t) / 4.0, 0, 1)
mix *= fade_in * fade_out
mix = np.tanh(mix * 1.4) / 1.4
left = mix + 0.08 * np.roll(padf * 0.1, int(0.011 * SR)); right = mix - 0.08 * np.roll(padf * 0.1, int(0.013 * SR))
st = np.stack([left, right], axis=1)
st /= max(1e-6, np.max(np.abs(st))) / 0.8
sf.write(out, st.astype(np.float32), SR)
print("music", round(dur, 2), "s ->", out)
