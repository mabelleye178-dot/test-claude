"""V3 mix: voice assembly + voice chain + music carve + ducking + loudness. Reads src/v3/timeline.json only.
Outputs: out/v3/audio/{voice_final.wav, music_final.wav, mix_final.wav} and public/audio/v3-mix.wav
"""
import json, os, subprocess, math, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, fftconvolve, butter, lfilter
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "audio"))
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
A = os.path.join(ROOT, "out/v3/audio"); os.makedirs(A, exist_ok=True)
tl = json.load(open(os.path.join(ROOT, "src/v3/timeline.json"), encoding="utf-8"))
SR = 48000; DUR = tl["totalFrames"] / tl["fps"]; N = int(DUR * SR)
TAG = os.environ.get("MIX_TAG", "")            # e.g. "_alt" keeps the V3 originals untouched
MUSIC_RAW = os.environ.get("MUSIC_RAW", "music_raw.wav")
DUCK_DB = float(os.environ.get("DUCK_DB", "-9.5")); BED_DB = float(os.environ.get("BED_DB", "-23.5"))
def ff(args): subprocess.run(["ffmpeg", "-v", "error", "-y"] + args, check=True)
def db(x): return 10 ** (x / 20)
def rms_active(x):
    a = x[np.abs(x) > 1e-3]; return np.sqrt(np.mean(a ** 2)) if len(a) else 1.0

# 1) assemble narration (per-cue level matching, so no sentence jumps out)
voice = np.zeros(N, dtype=np.float32)
for c in tl["cues"]:
    clip = os.path.join(ROOT, "out/v3/tts", c["id"] + ".wav")
    if not os.path.exists(clip): clip = os.path.join(ROOT, "assets/v3/tts", c["id"] + ".wav")  # committed copies
    x, sr = sf.read(clip, dtype="float32")
    if x.ndim > 1: x = x.mean(1)
    x = resample_poly(x, SR, sr).astype(np.float32)
    x *= db(-20) / rms_active(x)
    n = min(len(x), 256); x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n)
    i0 = int(c["start"] * SR); voice[i0:i0 + len(x)] += x[: N - i0]
sf.write(os.path.join(A, "voice_raw.wav"), voice, SR)

# 2) voice chain: HPF, de-mud, presence, air, de-esser, gentle compression, safety limiter
chain = ("highpass=f=85,bass=g=-1.5:f=180,equalizer=f=240:t=q:w=1.0:g=-2.2,equalizer=f=3300:t=q:w=1.1:g=2.4,treble=g=3:f=9000,"
         "deesser=i=0.35:m=0.5:f=0.5:s=o,acompressor=threshold=-21dB:ratio=2.6:attack=8:release=140:makeup=2.5,alimiter=limit=0.89:level=false")
ff(["-i", os.path.join(A, "voice_raw.wav"), "-af", chain, "-ar", str(SR), "-c:a", "pcm_f32le", os.path.join(A, "voice_proc.wav")])
v, _ = sf.read(os.path.join(A, "voice_proc.wav"), dtype="float32"); v = v[:N] if len(v) >= N else np.pad(v, (0, N - len(v)))
v *= db(-19) / rms_active(v)
# subtle room: stereo early-reflection tail at -23 dB under a dead-centre dry voice (mono compatible)
r = np.random.default_rng(3); n_ir = int(0.38 * SR)
ir = r.standard_normal((n_ir, 2)) * np.exp(-np.linspace(0, 8, n_ir))[:, None]; ir[: int(0.012 * SR)] = 0
b_, a_ = butter(2, [300 / (SR / 2), 5000 / (SR / 2)], btype="band"); ir = lfilter(b_, a_, ir, axis=0); ir /= np.sqrt((ir ** 2).sum(0))
wet = np.stack([fftconvolve(v, ir[:, 0])[:N], fftconvolve(v, ir[:, 1])[:N]], 1) * db(-23)
voice_st = np.stack([v, v], 1) + wet

# 3) music: carve the speech band, then duck under the voice
ff(["-i", os.path.join(A, MUSIC_RAW), "-af", "highpass=f=30,equalizer=f=2600:t=q:w=0.8:g=-3,equalizer=f=300:t=q:w=1.2:g=-1.5", "-ar", str(SR), "-c:a", "pcm_f32le", os.path.join(A, "music_eq.wav")])
m, _ = sf.read(os.path.join(A, "music_eq.wav"), dtype="float32"); m = m[:N]
m *= db(BED_DB) / np.sqrt(np.mean(m ** 2))
duck = np.ones(N, dtype=np.float32); g = db(DUCK_DB)
cues = tl["cues"]
for i, c in enumerate(cues):
    a = int((c["start"] - 0.10) * SR); b = int((c["end"] + 0.22) * SR)
    if i + 1 < len(cues) and cues[i + 1]["start"] - c["end"] < 0.75: b = int((cues[i + 1]["start"] - 0.10) * SR)  # stay down across short pauses: no pumping
    duck[max(0, a):min(N, b)] = g
out = np.empty_like(duck); y = 1.0; ka = 1 - math.exp(-1 / (0.14 * SR)); kr = 1 - math.exp(-1 / (0.55 * SR))
for i in range(N):
    tgt = duck[i]; y += (ka if tgt < y else kr) * (tgt - y); out[i] = y
m_ducked = m * out[:, None]
mask = np.zeros(N, bool)
for c in cues: mask[int(c['start'] * SR):int(c['end'] * SR)] = True
dbv = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
SEP = dbv(v[mask]) - dbv(m_ducked[mask]); GAPM = dbv(m_ducked[~mask]); TAILM = dbv(m_ducked[int((cues[-1]['end'] + 0.6) * SR):])
print(f'voice-to-music separation during speech {SEP:.1f} dB; music in pauses {GAPM:.1f} dB; music in outro tail {TAILM:.1f} dB')

# 4) sum, static gain to -16 LUFS (dynamics untouched), true-peak safety limiter
mix = voice_st + m_ducked
sf.write(os.path.join(A, "mix_pre.wav".replace(".", TAG + ".")), mix, SR, subtype="FLOAT")
def loud(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"], capture_output=True, text=True).stderr
    tail = p[p.rfind("Summary:"):]
    I = float(tail.split("I:")[1].split("LUFS")[0]); LRA = float(tail.split("LRA:")[1].split("LU")[0]); TP = float(tail.split("Peak:")[1].split("dBFS")[0])
    return I, LRA, TP
I, LRA, TP = loud(os.path.join(A, "mix_pre.wav".replace(".", TAG + ".")))
gain = -16.0 - I
for attempt in range(4):
    ff(["-i", os.path.join(A, "mix_pre.wav".replace(".", TAG + ".")), "-af", f"volume={gain:.2f}dB,alimiter=limit={db(-1.8):.4f}:attack=3:release=60:level=false", "-ar", str(SR), "-c:a", "pcm_s24le", os.path.join(A, "mix_final.wav".replace(".", TAG + "."))])
    I2, LRA2, TP2 = loud(os.path.join(A, "mix_final.wav".replace(".", TAG + ".")))
    if abs(I2 + 16) < 0.25 and TP2 <= -1.2: break
    gain += (-16.0 - I2)
print(f"pre-mix I {I:.1f} LUFS, TP {TP:.1f}; final I {I2:.2f} LUFS, LRA {LRA2:.1f} LU, TP {TP2:.2f} dBTP (static gain {gain:+.2f} dB)")
sf.write(os.path.join(A, "voice_final.wav".replace(".", TAG + ".")), (voice_st * db(gain)).astype(np.float32), SR, subtype="PCM_24")
sf.write(os.path.join(A, "music_final.wav".replace(".", TAG + ".")), (m * db(gain)).astype(np.float32), SR, subtype="PCM_24")
os.makedirs(os.path.join(ROOT, "public/audio"), exist_ok=True)
if not TAG: ff(["-i", os.path.join(A, "mix_final.wav"), "-c:a", "pcm_s16le", os.path.join(ROOT, "public/audio/v3-mix.wav")])
json.dump({"integrated_lufs": I2, "lra": LRA2, "true_peak_dbtp": TP2, "static_gain_db": round(gain, 2), "duck_db": DUCK_DB, "speech_separation_db": round(float(SEP), 1), "music_bed_rms_db": BED_DB, "voice_rms_db": -19}, open(os.path.join(A, "mix_report.json".replace(".", TAG + ".")), "w"), indent=1)
