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
const scenes = [
  ["00:00–00:06", "钩子 Hook", [0, 6]],
  ["00:06–00:12", "片头 Title", [6, 12.4]],
  ["00:12–00:24", "股权结构 Ownership", [12.4, 24.5]],
  ["00:24–00:35", "董事会矩阵 Board", [24.5, 35]],
  ["00:35–00:46", "权力结构 Power", [35, 46]],
  ["00:46–00:66", "新闻时间线 Timeline", [46, 65.8]],
  ["01:06–01:13", "结论 Verdict", [65.8, 73.3]],
  ["01:13–01:15", "片尾 Outro", [73.3, 75]],
];
let md = `# 《黄仁勋的3.58%：谁真正控制英伟达？》旁白稿\n\n时长 75 秒 · 1080×1920 · 30fps · 语速约 4.2 字/秒\n\n`;
for (const [range, name, [a, b]] of scenes) {
  md += `## ${range} ${name}\n\n`;
  for (const c of cues.filter((c) => c.start >= a && c.start < b)) md += `- [${ts(c.start)} → ${ts(c.end)}] ${c.text}\n`;
  md += "\n";
}
md += `## 配音提示\n\n- 语气：低沉、克制、纪录片式；数字处稍作停顿。\n- 「未经证实」「尚无公开证据」等限定语必须清晰读出，不可省略。\n- 每条字幕对应一句旁白，时间轴见 voiceover-timeline.csv，可直接导入 TTS 或配音软件逐句对齐。\n`;
fs.writeFileSync(path.join(outDir, "narration.md"), md);
const total = cues.reduce((n, c) => n + c.text.length, 0);
console.log(`cues=${cues.length} chars=${total} avg=${(total / 75).toFixed(2)} chars/s`);
