// Generates deliverables/narration.srt, narration.md and voiceover-timeline.csv from src/subtitles.json
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(new URL(".", import.meta.url).pathname, "..");
const cues = JSON.parse(fs.readFileSync(path.join(root, "src/subtitles.json"), "utf8"));
const outDir = path.join(root, "deliverables");
fs.mkdirSync(outDir, { recursive: true });
const ts = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), ms = Math.round((s - Math.floor(s)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
};
const srt = cues.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join("\n");
fs.writeFileSync(path.join(outDir, "narration.srt"), srt);
const csv = ["index,start_sec,end_sec,duration_sec,chars,text", ...cues.map((c, i) => `${i + 1},${c.start},${c.end},${(c.end - c.start).toFixed(2)},${c.text.length},"${c.text.replace(/"/g, '""')}"`)].join("\n");
fs.writeFileSync(path.join(outDir, "voiceover-timeline.csv"), csv);
const timing = JSON.parse(fs.readFileSync(path.join(root, "src/timing.json"), "utf8"));
const NAMES = { hook: "钩子 Hook", title: "片头 Title", ownership: "股权结构 Ownership", board: "董事会矩阵 Board", power: "权力结构 Power", timeline: "新闻时间线 Timeline", verdict: "结论 Verdict", outro: "片尾 Outro" };
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const scenes = []; let acc = 0;
for (const sc of timing.scenes) { const a = acc / timing.fps, b = (acc + sc.d) / timing.fps; scenes.push([`${mmss(a)}–${mmss(b)}`, NAMES[sc.id], [a, b]]); acc += sc.d - timing.transition; }
const totalSec = timing.totalFrames / timing.fps;
let md = `# 《黄仁勋的3.58%：谁真正控制英伟达？》旁白稿\n\n时长 ${totalSec.toFixed(1)} 秒 · 1080×1920 · 30fps · 旁白按真实语音长度对齐\n\n`;
for (const [range, name, [a, b]] of scenes) {
  md += `## ${range} ${name}\n\n`;
  for (const c of cues.filter((c) => c.scene ? NAMES[c.scene] === name : (c.start >= a && c.start < b))) md += `- [${ts(c.start)} → ${ts(c.end)}] ${c.text}\n`;
  md += "\n";
}
md += `## 配音提示\n\n- 语气：低沉、克制、纪录片式；数字处稍作停顿。\n- 「未经证实」「尚无公开证据」等限定语必须清晰读出，不可省略。\n- 每条字幕对应一句旁白，时间轴见 voiceover-timeline.csv，可直接导入 TTS 或配音软件逐句对齐。\n`;
fs.writeFileSync(path.join(outDir, "narration.md"), md);
const total = cues.reduce((n, c) => n + c.text.length, 0);
console.log(`cues=${cues.length} chars=${total} video=${totalSec.toFixed(2)}s avg=${(total / totalSec).toFixed(2)} chars/s`);
