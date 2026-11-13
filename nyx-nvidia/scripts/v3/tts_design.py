"""Step 1: design the Nyx Lab narrator voice once with Qwen3-TTS VoiceDesign (reference clip for cloning)."""
import time, sys, os, soundfile as sf, torch
sys.path.insert(0, os.path.dirname(__file__))
from qwen_common import load, OUT, SCRIPT
REF_TEXT = "英伟达只有一类普通股，一股一票。所以，持有多少股份，和掌握多少权力，从来不是同一个问题。"
m = load("qwen3-tts-voicedesign")
for seed in [int(s) for s in (sys.argv[1:] or ["11", "23"])]:
    torch.manual_seed(seed); t0 = time.time()
    wavs, sr = m.generate_voice_design(text=REF_TEXT, language="Chinese", instruct=SCRIPT["voiceInstruct"])
    p = os.path.join(OUT, f"ref_seed{seed}.wav"); sf.write(p, wavs[0], sr)
    dur = len(wavs[0]) / sr
    print(f"seed {seed}: {dur:.1f}s audio in {time.time()-t0:.0f}s (RTF {(time.time()-t0)/dur:.1f}) sr={sr} -> {p}", flush=True)
open(os.path.join(OUT, "ref_text.txt"), "w", encoding="utf-8").write(REF_TEXT)
