"""V3 alternative score ("drive" version): ORIGINAL composition, NOT the commercial track the brief referenced.
Four-on-the-floor groove, off-beat bass, pumping pads, pluck arpeggio and a lead motif of our own, in F# minor.
The beat grid is fitted per scene so that every scene change lands on a downbeat and key data cues sit close to beats.
Output: out/v3/audio/music_raw_alt.wav (+ out/v3/audio/alt_grid.json with the fitted tempi)
"""
import sys, os, json, math
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "audio"))
import score as S
from score import SR, sec, note, pan, place, reverb, IR_HALL, IR_ROOM, lp, hp

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
tl = json.load(open(os.path.join(ROOT, "src/v3/timeline.json"), encoding="utf-8"))
FPS, T = tl["fps"], tl["transition"]; DUR = tl["totalFrames"] / FPS; N = sec(DUR) + sec(4)
cue = {c["id"]: c for c in tl["cues"]}; scn = {s["id"]: s for s in tl["scenes"]}; order = [s["id"] for s in tl["scenes"]]
bounds = {}
for i, sid in enumerate(order):
    a = 0.0 if i == 0 else (scn[sid]["start"] + T / 2) / FPS
    b = DUR if i == len(order) - 1 else (scn[order[i + 1]]["start"] + T / 2) / FPS
    bounds[sid] = (a, b)
rng = np.random.default_rng(1493)
c = lambda k, off=0.0: cue[k]["start"] + off
fr = lambda frames: frames / FPS

# ---------- per-scene beat grid: integer beats per scene, tempo 117-127 BPM, key cues near beats ----------
KEY = {"hook": ["hook.event", "hook.q"], "ownership": ["own.huang", "own.funds", "own.insiders", "own.vote1", "own.vote2"],
       "board": ["board.elect", "board.expand", "board.one"], "power": ["pow.sh", "pow.board", "pow.ceo", "pow.back", "pow.founder"],
       "timeline": ["tl.bg", "tl.oct", "tl.nov", "tl.alleg", "tl.nov8"], "turning": ["turn.resign", "turn.kress", "turn.chair"],
       "insight": ["ins.neq", "ins.start", "ins.rest"], "conclusion": ["end.quote", "end.note", "end.brand"]}
grid = {}
for sid in order:
    a, b = bounds[sid]; L = b - a; best = None
    for n in range(int(L * 117 / 60), int(L * 127 / 60) + 2):
        bpm = 60 * n / L
        if not 117 <= bpm <= 127: continue
        beat = L / n
        err = sum((((c(k) - a) / beat * 2 + 0.5) % 1 - 0.5) ** 2 for k in KEY[sid])  # distance to the nearest 8th note
        if best is None or err < best[0]: best = (err, n, bpm, beat)
    _, n, bpm, beat = best
    grid[sid] = {"a": a, "b": b, "beats": n, "bpm": round(bpm, 2), "beat": beat,
                 "cue_offsets_in_beats": {k: round(((c(k) - a) / beat + 0.5) % 1 - 0.5, 2) for k in KEY[sid]},
                 "cue_ms_to_nearest_8th": {k: round(abs(((c(k) - a) / beat * 2 + 0.5) % 1 - 0.5) * beat / 2 * 1000) for k in KEY[sid]}}
def beats(sid): g = grid[sid]; return [g["a"] + i * g["beat"] for i in range(g["beats"])], g["beat"]

# ---------- harmony (F# minor) ----------
Fm, D, A, E, Bm, Cm = (42, [0, 3, 7, 10]), (38, [0, 4, 7, 11]), (45, [0, 4, 7]), (40, [0, 4, 7]), (47, [0, 3, 7]), (37, [0, 3, 7])
PROG = {"hook": [Fm, Fm, D, D], "ownership": [Fm, D, A, E], "board": [Fm, D, A, E], "power": [Fm, D, Bm, E],
        "timeline": [Fm, Fm, D, Cm], "turning": [D, D, A, A, Fm, Fm, E, E], "insight": [D, E, Fm, A], "conclusion": [D, E, Fm, A]}
def chord(sid, bar): p = PROG[sid]; return p[bar % len(p)]

# ---------- instruments ----------
def kick(t, g=1.0):
    n = sec(0.34); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(47 + 105 * np.exp(-tt * 34)) / SR) * np.exp(-tt * 9.5)
    s += 0.25 * hp(rng.standard_normal(n), 2500) * np.exp(-tt * 260)
    return pan(s * g, 0), t
def bass_note(f, dur, cutoff, g=1.0):
    n = sec(dur); tt = np.arange(n) / SR
    s = 0.7 * np.sin(2 * np.pi * f * tt) + 0.55 * lp(2 * ((f * tt) % 1) - 1 + 0.5 * (2 * ((f * 2.003 * tt) % 1) - 1), cutoff)
    return pan(s * np.minimum(1, tt / 0.004) * np.minimum(1, (dur - tt) / 0.02) * np.exp(-tt * 2.2) * g, 0)
def hat(dur=0.045, g=1.0, p=0.0, fc=7500):
    n = sec(dur * 4); tt = np.arange(n) / SR
    return pan(hp(rng.standard_normal(n), fc) * np.exp(-tt / dur) * g, p)
def clap(g=1.0):
    n = sec(0.28); tt = np.arange(n) / SR; env = sum(np.exp(-np.maximum(0, tt - d) * 55) * (tt >= d) for d in (0, 0.011, 0.023)) * 0.5 + np.exp(-tt * 18) * 0.4
    s = hp(lp(rng.standard_normal((n, 2)), 4200), 900) * env[:, None]
    return s * g
def crash(g=1.0):
    n = sec(2.2); tt = np.arange(n) / SR
    return hp(rng.standard_normal((n, 2)), 4500) * (np.exp(-tt * 2.6) * np.minimum(1, tt / 0.003))[:, None] * g
def pluck(f, g=1.0):
    n = sec(0.5); tt = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * h * tt) * np.exp(-tt * (7 + 5 * h)) / h for h in (1, 2, 3, 4, 5))
    return s * np.minimum(1, tt / 0.002) * g
def lead_note(f, dur, g=1.0):
    n = sec(dur + 0.25); tt = np.arange(n) / SR; vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * tt) * np.minimum(1, tt / 0.3)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    s = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    return s * np.minimum(1, tt / 0.03) * np.clip((dur + 0.25 - tt) / 0.25, 0, 1) * g
def key_note(f, v):
    n = sec(3.0); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + 0.42 * np.sin(4 * np.pi * f * tt) * np.exp(-tt * 3) + 0.18 * np.sin(2 * np.pi * 3.01 * f * tt) * np.exp(-tt * 6)) * np.exp(-tt * 1.7) * np.minimum(1, tt / 0.006) * v
def pingpong(st, time, fb=0.4, mixg=0.35):
    out = st.copy(); d = sec(time)
    for k in range(1, 6):
        sh = np.zeros_like(st); sh[d * k:] = st[: len(st) - d * k]
        out += (sh[:, ::-1] if k % 2 else sh) * (fb ** k) * mixg
    return out
def tick(t, f=1900.0, g=1.0, p=0.0):
    n = sec(0.14); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) * np.exp(-tt * 55) + 0.3 * np.sin(2 * np.pi * f * 2.01 * tt) * np.exp(-tt * 110)) * np.minimum(1, tt / 0.001)
    b = np.zeros((N, 2)); place(b, pan(s, p), t); return b * g
def thud(t, g=1.0):
    n = sec(0.7); tt = np.arange(n) / SR; b = np.zeros((N, 2))
    place(b, pan(np.sin(2 * np.pi * (52 + 50 * np.exp(-tt * 22)) * tt) * np.exp(-tt * 6.5), 0), t); return b * g

# ---------- section builder ----------
def groove(sid, kick_g=0.0, bass_g=0.0, bass_cut=420, rolling=False, hats_g=0.0, open_g=0.0, clap_g=0.0, pad_g=0.0, pad_cut=(500, 900), pump=0.55,
           arp_g=0.0, arp_mask="x.xx.x.xx.x.xx.x", start_beat=0, kick_from=0, kick_until=None, crash_g=0.0):
    bt, beat = beats(sid); a, b = grid[sid]["a"], grid[sid]["b"]; nb = len(bt)
    drums = np.zeros((N, 2)); bassb = np.zeros((N, 2)); padb = np.zeros((N, 2)); arpb = np.zeros((N, 2))
    ku = nb if kick_until is None else kick_until
    for i, t in enumerate(bt):
        bar, pos = i // 4, i % 4; root, ints = chord(sid, bar)
        if i < start_beat: continue
        if kick_g and kick_from <= i < ku: s, _ = kick(t, kick_g); place(drums, s, t)
        if clap_g and pos in (1, 3) and kick_from <= i < ku: place(drums, clap(clap_g), t)
        if hats_g:
            place(drums, hat(0.04, hats_g, 0.25), t + beat / 2)
            place(drums, hat(0.022, hats_g * 0.45, -0.3), t + beat / 4); place(drums, hat(0.022, hats_g * 0.4, 0.3), t + 3 * beat / 4)
        if open_g and pos in (1, 3): place(drums, hat(0.16, open_g, -0.2, 6000), t + beat / 2)
        if bass_g and kick_from <= i < ku:
            f = note(root)
            if rolling:
                for j in (1, 2, 3): place(bassb, bass_note(f, beat * 0.22, bass_cut, bass_g * (0.9 if j == 2 else 0.7)), t + j * beat / 4)
            else:
                place(bassb, bass_note(f, beat * 0.46, bass_cut, bass_g), t + beat / 2)
        if arp_g:
            for j in range(4):
                if arp_mask[(pos * 4 + j) % 16] == "x":
                    k16 = i * 4 + j; iv = ints[[0, 2, 1, 2, 0, 1, 2, 1][k16 % 8] % len(ints)]; octv = 24 + (12 if (k16 // 16) % 2 and j == 3 else 0)
                    place(arpb, pan(pluck(note(root + iv + octv), arp_g * (1.0 if j == 0 else 0.75)), 0.3 * (1 if k16 % 2 else -1)), t + j * beat / 4)
    if pad_g:
        t_all = np.arange(N) / SR
        for bar in range((nb + 3) // 4):
            t0 = bt[bar * 4]; t1 = min(b + 0.6, t0 + 4 * beat + 0.5); n = sec(t1 - t0); tt = np.arange(n) / SR
            root, ints = chord(sid, bar); ch = np.zeros((n, 2))
            for k, iv in enumerate(ints):
                f = note(root + 12 + iv)
                for vv, det in enumerate((-0.007, 0.003, 0.011)):
                    ch += pan(2 * ((f * (1 + det) * tt + rng.uniform()) % 1) - 1, (-0.75 + 0.5 * vv) * (1 if k % 2 else -1)) / (len(ints) * 3)
            env = np.minimum(1, tt / 0.25) * np.clip((t1 - t0 - tt) / 0.5, 0, 1)
            frac = (t0 - a) / max(1e-6, b - a); ch = lp(ch, pad_cut[0] + (pad_cut[1] - pad_cut[0]) * frac)
            place(padb, ch * env[:, None], t0)
        if pump and kick_g:
            g = np.ones(N)
            for i, t in enumerate(bt):
                if kick_from <= i < ku:
                    i0 = sec(t); n = sec(beat); tt = np.arange(n) / SR; g[i0:i0 + n] = np.minimum(g[i0:i0 + n], 1 - pump * np.exp(-tt / (beat * 0.32)))
            padb *= g[:, None]
        padb = reverb(padb, IR_HALL, 0.4) * pad_g
    if arp_g: arpb = reverb(pingpong(arpb, beat * 0.75), IR_HALL, 0.3)
    drums = reverb(drums, IR_ROOM, 0.08)
    out = drums + bassb + padb + arpb
    if crash_g: place(out, crash(crash_g), a)
    return out

def riser(t_hit, length, g):
    n = sec(length); tt = np.arange(n) / SR; b = np.zeros((N, 2))
    nz = hp(lp(rng.standard_normal((n, 2)), 1200 + 6000 * (tt[-1] / length)), 400) * ((tt / length) ** 2.4)[:, None]
    place(b, nz, t_hit - length); return b * g
def snare_roll(sid, bars=2, g=0.4):
    bt, beat = beats(sid); b = np.zeros((N, 2)); end = grid[sid]["b"]; start = end - bars * 4 * beat; t = start; k = 0
    while t < end - 0.02:
        prog = (t - start) / (end - start); step = beat / (2 if prog < 0.5 else 4 if prog < 0.82 else 8)
        n = sec(0.12); tt = np.arange(n) / SR
        s = (hp(lp(rng.standard_normal(n), 5500), 700) * np.exp(-tt * 38) + 0.5 * np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 45))
        place(b, pan(s * (0.35 + 0.65 * prog), 0.1 * (-1) ** k), t); t += step; k += 1
    return reverb(b, IR_ROOM, 0.15) * g
def lead_phrase(sid, from_bar, bars, g):
    """our own 2-bar motif in F# minor: C#5 . E5 F#5 | A5 . G#5 E5  (answers itself an octave lower every other time)"""
    bt, beat = beats(sid); b = np.zeros((N, 2)); motif = [(0, 73, 1.5), (1.5, 76, 0.5), (2, 78, 2), (4, 81, 1.5), (5.5, 80, 0.5), (6, 76, 2)]
    for rep in range(bars // 2):
        i0 = (from_bar + rep * 2) * 4
        if i0 >= len(bt): break
        for off, m, d in motif:
            t = bt[i0] + off * beat
            if t < grid[sid]["b"] - 0.1: place(b, pan(lead_note(note(m - (12 if rep % 2 else 0)), d * beat * 0.92, 1.0), 0.0), t)
    return reverb(pingpong(b, beat * 0.75, 0.35, 0.3), IR_HALL, 0.38) * g
def keys(notes, g):
    b = np.zeros((N, 2))
    for i, (t, m, v) in enumerate(notes): place(b, pan(key_note(note(m), v), -0.2 + 0.4 * ((i * 37) % 10) / 10), t)
    return reverb(b, IR_HALL, 0.42) * g
def sub_drone(a, b, m, g):
    n = sec(b - a); tt = np.arange(n) / SR; f = note(m)
    s = (0.6 * np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 2.003 * tt)) * np.minimum(1, tt / 1.0) * np.clip((b - a - tt) / 0.8, 0, 1) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.08 * tt))
    out = np.zeros((N, 2)); place(out, pan(s, 0), a); return out * g

mix = np.zeros((N, 2))
bh, beat_h = beats("hook")
# 01 hook: filtered atmosphere; a heartbeat kick enters with the event, hats tick in before the first drop
ev_beat = int(round((c("hook.event") - grid["hook"]["a"]) / beat_h))
mix += sub_drone(0, bounds["hook"][1], 30, 0.5) + groove("hook", kick_g=0.55, kick_from=ev_beat, pad_g=0.6, pad_cut=(260, 700), pump=0.35, hats_g=0.0)
mix += groove("hook", hats_g=0.12, start_beat=int(round((c("hook.q") - grid["hook"]["a"]) / beat_h)))
mix += S.impact(N, 0.12, 0.4, size=0.8)
for i in range(7): mix += tick(0.18 + i * 0.15, 1300 * 2 ** (i / 12), 0.045, -0.4 + i * 0.13)
mix += keys([(c("hook.q", 0.15), 73, 0.5), (c("hook.q", 0.15 + 2 * beat_h), 69, 0.42)], 0.5)
# 02 ownership: the groove arrives — kick, off-beat bass, hats, a sparse pluck figure
mix += groove("ownership", kick_g=0.8, bass_g=0.5, bass_cut=380, hats_g=0.2, pad_g=0.5, pad_cut=(600, 1000), arp_g=0.2, arp_mask="x..x..x...x..x..", crash_g=0.16)
# 03 board: wider and tenser — clap, open hats, fuller arpeggio
mix += groove("board", kick_g=0.8, bass_g=0.52, bass_cut=460, hats_g=0.22, open_g=0.12, clap_g=0.3, pad_g=0.55, pad_cut=(900, 1400), arp_g=0.24, crash_g=0.14)
# 04 power: the build — lead motif enters with the CEO layer, snare roll into the timeline
gp = grid["power"]; ceo_bar = int(((c("pow.ceo") - gp["a"]) / gp["beat"]) // 4)
mix += groove("power", kick_g=0.82, bass_g=0.55, bass_cut=560, hats_g=0.24, open_g=0.14, clap_g=0.32, pad_g=0.58, pad_cut=(1000, 2200), arp_g=0.26, arp_mask="x.xx.x.xx.xx.x.x", crash_g=0.16)
mix += lead_phrase("power", ceo_bar, 2 * max(1, ((gp["beats"] // 4) - ceo_bar) // 2), 0.2) + snare_roll("power", 2, 0.34)
# 05 timeline: the darker drop — rolling bass, no lead, filter closing towards the turning point
mix += groove("timeline", kick_g=0.85, bass_g=0.5, bass_cut=520, rolling=True, hats_g=0.24, open_g=0.1, clap_g=0.26, pad_g=0.42, pad_cut=(1100, 380), arp_g=0.12, arp_mask="x.......x..x....", crash_g=0.2)
# 06 turning point: breakdown — drums out, long chords, keys
gt = grid["turning"]
mix += sub_drone(gt["a"], gt["b"], 26, 0.55) + groove("turning", pad_g=0.5, pad_cut=(420, 800), pump=0)
mix += keys([(c("turn.kress", fr(6)), 69, 0.55), (c("turn.chair", 0.1), 73, 0.5), (c("turn.chair", 0.1 + gt["beat"] * 2), 76, 0.45)], 0.55)
# 07 insight: half energy — soft kick, the pluck figure alone, room for the idea
mix += groove("insight", kick_g=0.5, bass_g=0.3, bass_cut=300, hats_g=0.1, pad_g=0.52, pad_cut=(700, 1100), pump=0.4, arp_g=0.22, arp_mask="x..x..x...x..x..")
# 08 conclusion: resolve; drums leave before the brand line; Nyx signature closes
gc = grid["conclusion"]; brand_beat = int((c("end.brand") - gc["a"]) / gc["beat"])
mix += groove("conclusion", kick_g=0.55, bass_g=0.34, bass_cut=340, hats_g=0.12, pad_g=0.6, pad_cut=(800, 1300), pump=0.4, arp_g=0.16, arp_mask="x.....x...x.....", kick_until=brand_beat, crash_g=0.1)
mix += keys([(c("end.quote", 0.2), 73, 0.5), (c("end.quote", 0.2 + gc["beat"] * 2), 76, 0.45), (c("end.quote", 0.2 + gc["beat"] * 4), 78, 0.5)], 0.45)
mix += S.brand_motif(N, cue["end.brand"]["end"] + 0.25, 0.36)

# transitions and cue-exact data SFX (same placements as the V3 original score, so picture sync is unchanged)
for sid, (rg, ig) in {"ownership": (0.32, 0.4), "board": (0.26, 0.3), "power": (0.28, 0.32), "timeline": (0.36, 0.5), "turning": (0.34, 0.7), "insight": (0.14, 0.2), "conclusion": (0.16, 0.25)}.items():
    h = bounds[sid][0]; mix += riser(h, 1.8, rg) + S.impact(N, h, ig, size=0.9)
for k, f0 in (("own.huang", 2100), ("own.funds", 1700), ("own.insiders", 1500), ("own.vote2", 2100)): mix += tick(c(k, 0.05), f0, 0.08, 0.2)
mix += tick(c("own.funds", fr(8)), 1800, 0.07, -0.2) + tick(c("own.vote1", fr(8)), 1400, 0.07, 0)
for i in range(10): mix += tick(c("board.elect", fr(i * 5)), 1500 if i % 2 else 1750, 0.055, -0.5 + i * 0.11)
mix += tick(c("board.expand", fr(4)), 2350, 0.09, 0.3) + thud(c("board.one", 0.1), 0.3)
for k, f0 in (("pow.sh", 1500), ("pow.board", 1700), ("pow.ceo", 1900)): mix += tick(c(k, 0.05), f0, 0.08, -0.2)
mix += tick(c("pow.ceo", fr(26)), 2100, 0.07, 0.2)
for k in range(3): mix += tick(c("pow.back", fr(10 + k * 14)), 2300 - k * 200, 0.06, 0.4)
for k in ("tl.bg", "tl.oct", "tl.nov", "tl.alleg", "tl.nov8"): mix += tick(c(k, 0.02), 1250 if k == "tl.alleg" else 1650, 0.075, -0.3)
mix += thud(c("turn.resign", fr(34)), 0.45) + tick(c("turn.chair", fr(30)), 1500, 0.055, 0.2) + thud(c("ins.neq", fr(16)), 0.24)

mix = mix[: sec(DUR)]; t = np.arange(len(mix)) / SR
mix *= (np.clip(t / 0.8, 0, 1) * np.clip((DUR - t) / 2.2, 0, 1))[:, None]
mix = hp(mix, 28); mix /= max(1e-6, np.max(np.abs(mix))) / 0.85
mix = S.saturate(mix, 1.08); mix /= max(1e-6, np.max(np.abs(mix))) / 0.8
sf.write(os.path.join(ROOT, "out/v3/audio/music_raw_alt.wav"), mix.astype(np.float32), SR, subtype="PCM_24")
json.dump(grid, open(os.path.join(ROOT, "out/v3/audio/alt_grid.json"), "w"), indent=1)
lo = lp(mix, 150)
for sid in order:
    a, b = bounds[sid]; seg = mix[sec(a):sec(b)]; g = grid[sid]
    worst = max(g["cue_ms_to_nearest_8th"].values()); mean8 = sum(g["cue_ms_to_nearest_8th"].values()) / len(g["cue_ms_to_nearest_8th"])
    print(f"  {sid:11s} {g['bpm']:6.2f} BPM x{g['beats']:3d} beats  rms {20*np.log10(np.sqrt(np.mean(seg**2))+1e-9):6.1f} dB  low<150Hz {20*np.log10(np.sqrt(np.mean(lo[sec(a):sec(b)]**2))+1e-9):6.1f} dB  L/R corr {np.corrcoef(seg[:,0],seg[:,1])[0,1]:.2f}  cue->8th note: mean {mean8:.0f} ms, worst {worst} ms")
print("alt score ->", round(DUR, 2), "s")
