# NyxNvidia 续接说明（给新的 Claude Code 会话）

分支：`claude/funny-planck-er4ozz` · 项目目录：`nyx-nvidia/`（Remotion 4.0.543，1080×1920，30fps）

## 已完成
- 8 个场景的黑金视觉（src/scenes/*），字幕系统（src/components/Subtitles.tsx），字体 public/fonts（Noto Sans/Serif SC 子集 + manifest）。
- 场景时长由 `src/timing.json` 驱动，字幕由 `src/subtitles.json` 驱动；两者都由 `scripts/audio/build_mix.py` 从真实语音时长生成。
- 文案/计划时间槽：`src/subtitles.plan.json`（可编辑的唯一文案源）。
- 配音脚本：`scripts/audio/tts.py`（piper/azure/elevenlabs/openai），发音词典 `scripts/audio/lexicon.py`，数字读法 `scripts/audio/zh_numbers.py`。
- 配乐引擎：`scripts/audio/score.py`（spec 驱动的原创程序化作曲；`demo` 生成 20 s 样片）。
- 旧成片保留在 deliverables/：nyx-nvidia-3.58.mp4（无声）、nyx-nvidia-3.58-voiced.mp4（Piper 配音）。不要覆盖。

## 最终阶段目标（用户 2026-11-13 授权自主完成）
1. 用开源 TTS（优先 Qwen3-TTS VoiceDesign，其次 MeloTTS，保底 Piper）逐句生成成熟知性女声旁白 -> out/tts/cue_NN.wav
2. score.py 按场景 spec 生成整片配乐 + 克制的转场/数据音效
3. 人声链（HPF/EQ/压缩/去齿音）+ ducking + loudnorm -16 LUFS / -1 dBTP
4. build_mix.py 重排时间轴 -> 渲染 out/nyx-nvidia-final.mp4
5. 质量检查（ffprobe、静音检测、ebur128、faster-whisper 转写比对、抽帧）
6. 交付 deliverables/：nyx-nvidia-final.mp4、nyx-nvidia-voice.wav、nyx-nvidia-music.wav、nyx-nvidia-final.srt、fact-check-final.md、production-report.md

## 重建命令
见 deliverables/audio-pipeline.md；最终版流程以 scripts/audio/final_pipeline.sh 为准（若存在）。
