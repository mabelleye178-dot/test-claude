# 音频流程说明 · 旁白 / 配乐 / Ducking / 重新对齐

## 一键重建

```bash
cd nyx-nvidia
python3 scripts/audio/tts.py            # 1. 逐句合成旁白 -> out/tts/cue_NN.wav + durations.json
python3 scripts/audio/build_mix.py      # 2. 按真实语音重排时间轴 -> src/subtitles.json, src/timing.json；生成配乐并 ducking -> public/audio/mix.wav
node scripts/export-captions.mjs        # 3. 重新导出 narration.md / narration.srt / voiceover-timeline.csv
npx remotion render NyxNvidia out/nyx-nvidia-3.58-voiced.mp4 --codec=h264 --crf=18 --audio-codec=aac
```

`src/subtitles.plan.json` 是字幕文案与"计划"时间槽（可编辑）；`src/subtitles.json` 与 `src/timing.json` 由脚本生成，不要手改。

## 当前使用的 TTS：Piper（本地、免费、开源）

- 模型 `zh_CN-huayan-medium`（MIT 许可，Rhasspy piper-voices），女声，离线运行，无需密钥。
- 数字、百分比、日期、H20/H200、CEO 等在 `scripts/audio/zh_numbers.py` 中转为口语读法，字幕显示文本不变。
- 语速：`PIPER_LENGTH=1.0`（默认 1.08 更慢）。

## 升级为云端神经语音（可选，需要你配置密钥）

脚本已支持三家，密钥只从环境变量读取，不写入文件或日志：

| 提供商 | 环境变量 | 推荐女声 | 价格量级 |
|---|---|---|---|
| Azure AI Speech（推荐，中文财经播报质感最好） | `AZURE_SPEECH_KEY`、`AZURE_SPEECH_REGION`（如 eastasia）、可选 `AZURE_VOICE`（默认 zh-CN-XiaoxiaoNeural）、`AZURE_STYLE`（默认 newscast-casual） | zh-CN-XiaoxiaoNeural / zh-CN-XiaoyiNeural | 约 $16 / 百万字符，本片 379 字 ≈ $0.006 |
| ElevenLabs | `ELEVENLABS_API_KEY`、可选 `ELEVENLABS_VOICE_ID` | Multilingual v2 任一女声 | 免费层每月 1 万字符即够 |
| OpenAI | `OPENAI_API_KEY`、可选 `OPENAI_VOICE`（默认 nova） | nova / shimmer | 约 $15–30 / 百万字符 |

运行方式（以 Azure 为例）：

```bash
TTS_PROVIDER=azure AZURE_SPEECH_KEY=*** AZURE_SPEECH_REGION=eastasia python3 scripts/audio/tts.py
python3 scripts/audio/build_mix.py && node scripts/export-captions.mjs
npx remotion render NyxNvidia out/nyx-nvidia-3.58-voiced.mp4 --codec=h264 --crf=18 --audio-codec=aac
```

在 Claude Code 云端环境中，更安全的做法是把密钥保存为环境的 network secret（代理注入请求头），而不是放进环境变量。

## 配乐

`scripts/audio/synth_music.py` 用 numpy 程序化合成原创配乐（A 小调低频 drone + 滤波 pad + 92 BPM 脉冲琶音 + 心跳式底鼓 + 场景切换前的噪声上升音），不含任何采样或第三方素材，版权完全归本项目，可商用。

## Ducking 与响度

- 人声优先：每句旁白前 0.12 s 至结束后 0.25 s，配乐压低 11 dB，起音 0.18 s、释放 0.45 s 的平滑曲线。
- 人声 RMS 约 -18 dBFS，配乐基底约 -27 dBFS。
- 混音后用 ffmpeg `loudnorm`（I=-16 LUFS, TP=-1.5 dB, LRA=11）统一到短视频平台常用响度。
