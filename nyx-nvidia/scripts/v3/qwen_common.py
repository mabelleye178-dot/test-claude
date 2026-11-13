import sys, types, os, json
try:
    import sox  # noqa: F401  (python wrapper; the binary is optional and unused for inference)
except Exception:
    sys.modules["sox"] = types.ModuleType("sox")
import torch
torch.set_num_threads(int(os.environ.get("TTS_THREADS", "4")))
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODELS = os.path.join(ROOT, "out/tts/models")
OUT = os.path.join(ROOT, "out/v3/tts"); os.makedirs(OUT, exist_ok=True)
SCRIPT = json.load(open(os.path.join(ROOT, "src/v3/script.json"), encoding="utf-8"))
def load(name):
    from qwen_tts import Qwen3TTSModel
    return Qwen3TTSModel.from_pretrained(os.path.join(MODELS, name), device_map="cpu", dtype=torch.float32)
