# 第一阶段 · 配音方案核查（2026-11-12）

## 真实可用性、授权方式与成本

| 方案 | 可用性核查结果 | 授权方式 | 成本量级（本片约 380 字） |
|---|---|---|---|
| **A. Azure zh-CN-XiaoxiaoNeural**（newscast / serious 风格） | 标准 Neural 音色，全部 Azure Speech 区域可用；支持 SSML 风格、语速、音高、音素级发音标注 | Azure 订阅 → 创建 Speech 资源 → 密钥 + 区域 | 约 $15–16 / 百万字符，F0 免费层每月 50 万字符；本片 ≈ $0.006 |
| **B. Azure Neural HD 中文女声** | 微软文档当前列出的中文 HD 音色：`zh-CN-Xiaochen:DragonHDLatestNeural`（标准 HD）与 `zh-CN-Xiaoxiao:DragonHDFlashLatestNeural`（HD Flash，带风格）。HD 仅限部分区域：East US、West Europe、Southeast Asia，2026 年 3 月起新增 East US 2、West US 2、Central India、Canada Central、France Central、Sweden Central | 同上，资源必须建在 HD 支持区域 | 第三方整理约 $22 / 百万字符（微软官方页面价格未直接显示，需在定价计算器核实）；本片 ≈ $0.01 |
| **C. ElevenLabs 最新模型** | 第三方资料称 2026 年已有 Eleven v4（$0.08 / 1K 字符）与 v4 Turbo；v3 于 2026-02 结束 alpha。脚本会读取账号的 `/v1/models` 列表，自动选择 v4 → v3 → multilingual_v2 | ElevenLabs 账号 → Profile → API Key | 免费层每月 1 万 credits（≈1 万字符）即可覆盖本片与试听；付费 Starter 约 $5–6 / 月 |

三家均未在本环境配置密钥，三家 API 域名在本环境网络策略中也默认不可达。我已通过 Claude Code 的安全凭据表单发起 Azure（East US）与 ElevenLabs 两项密钥请求，表单被拒绝，因此本阶段无法生成 A/B/C 试听。

## 配置方法（任选其一，密钥不要贴进聊天）

1. **推荐：环境网络密钥**。Claude Code 云端环境设置 → 当前环境「M」→ Network secrets → 新增：
   - Host `eastus.tts.speech.microsoft.com`，Header `Ocp-Apim-Subscription-Key`，值为 Azure Speech 密钥（资源需在 East US；若在其他区域，告诉我区域名，我改 host）。
   - Host `api.elevenlabs.io`，Header `xi-api-key`，值为 ElevenLabs API Key。
   代理会在请求时自动注入，代码和日志里永远不出现密钥。配置后运行：
   ```bash
   cd nyx-nvidia && python3 scripts/audio/tts_sample.py
   ```
2. 本地运行：`AZURE_SPEECH_KEY=… AZURE_SPEECH_REGION=eastus ELEVENLABS_API_KEY=… python3 scripts/audio/tts_sample.py`

脚本会先拉取 Azure 实时音色列表确认 HD 音色是否在该区域可用，再生成四段试听（Xiaoxiao newscast、Xiaoxiao serious、HD 女声、ElevenLabs），文案相同：

> 黄仁勋持有约8.7亿股，占3.58%。先锋领航7.31%，贝莱德7.43%。2025年，H20出口先受限，后放行。11月12日，黄仁勋辞任，克雷斯代理CEO。

## 发音词典（scripts/audio/lexicon.py）

| 词条 | 标准读法 | Azure SSML 处理 | 其他引擎文本替换 |
|---|---|---|---|
| 黄仁勋 | huáng rén xūn（勋一声） | `<phoneme alphabet="sapi" ph="huang 2 ren 2 xun 1">` | 原文 |
| NVIDIA / 英伟达 | yīng wěi dá | `<sub alias="英伟达">` | 英伟达 |
| 3.58% / 7.31% / 7.43% / 4% | 百分之三点五八 … | `<say-as interpret-as="cardinal">` | 百分之三点五八 |
| 8.7亿 | 八点七亿 | say-as cardinal | 八点七亿 |
| H20 / H200 | H 二零 / H 二零零（行业通行） | `<say-as characters>H</say-as><say-as digits>20</say-as>` | H二零 / H二零零 |
| CEO / CFO | 逐字母 | `<say-as interpret-as="characters">` | C E O |
| 委托书 | wěi tuō shū | phoneme 标注 | 原文 |
| 辞任 / 任免 | cí rèn / rèn miǎn | phoneme 标注 | 原文 |
| 先锋领航 / 贝莱德 / 克雷斯 | 官方中文名 | 原文 | 原文 |
| 年份 2026年 | 二零二六年 | `<say-as interpret-as="digits">` | 二零二六年 |
| 标点停顿 | 逗号 220 ms，句号 420 ms | `<break>` | 由引擎处理 |

## 第二阶段 · 音乐试听

`deliverables/nyx-music-demo-20s.m4a`（及同名 WAV，24-bit）。原创程序化作曲，无采样、无第三方素材，版权归项目。

| 时间 | 段落 | 内容 |
|---|---|---|
| 0–5 s | 开场 | A 小调低频 drone、滤波氛围 pad、零星高频数据提示音；5 s 处噪声上升 + 短促冲击 |
| 5–12 s | 中段 | 96 BPM 十六分音符脉冲琶音（乒乓延迟）、每两拍心跳底鼓、数据 blip；和声每 4 小节在 Am7–Fmaj7–C–G7 与 Am–Dm–E–Am7 两组进行间交替，避免循环感 |
| 12–16.5 s | 高潮 | 四拍底鼓、小二度弦乐式张力动机、持续上行高音线、pad 滤波全开；无预告片式夸张音效 |
| 16.5–20 s | 收尾 | 节奏收束，Nyx 品牌收尾音：E5–B4–E6 三音钟声动机 + 低频下沉 |

技术：真实立体声分层（pad 分声部左右、琶音乒乓延迟、两套不同卷积混响），低频与底鼓居中；原始动态范围 LRA 5.4 LU，未做母带压缩。整片版本会把这四类段落映射到 8 个场景，冲击音落在场景切换点。
