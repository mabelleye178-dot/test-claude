// All figures below are tagged with their source class.
// confirmed: SEC filing / company statement.  media: named press report.  unverified: allegation without public evidence.
export type SourceClass = "confirmed" | "media" | "unverified";

export const OWNERSHIP = {
  asOf: "2026-03-23",
  filing: "2026年股东委托书 (DEF 14A, 2026-05-12)",
  sharesOutstanding: 24_312_141_810,
  rows: [
    { key: "huang", label: "黄仁勋 Jensen Huang", sub: "创始人 · 时任CEO", shares: 870_604_104, pct: 3.58 },
    { key: "vanguard", label: "先锋领航 Vanguard", sub: "被动指数基金", shares: 1_777_408_252, pct: 7.31 },
    { key: "blackrock", label: "贝莱德 BlackRock", sub: "被动指数基金", shares: null, pct: 7.43 },
    { key: "insiders", label: "全体董事及高管", sub: "含黄仁勋", shares: null, pct: 3.94 },
  ],
  publicPct: 81.3, // 100 - 7.31 - 7.43 - 3.94  (rounded, illustrative remainder)
};

export const BOARD = {
  electedOn: "2026-06-24",
  seatsElected: 10,
  independentElected: 9,
  expandedOn: "2026-07-13",
  seatsAfterExpansion: 11,
  huangLeftOn: "2026-11-11",
  seatsAfterExit: 10,
  // Names confirmed in SEC filing excerpts; others shown by role only.
  seats: [
    { id: 1, name: "黄仁勋", en: "Jen-Hsun Huang", role: "创始人 · CEO · 非独立", since: "1993", independent: false, isHuang: true },
    { id: 2, name: "Tench Coxe", en: "", role: "独立董事", since: "1993", independent: true },
    { id: 3, name: "Harvey C. Jones", en: "", role: "独立董事", since: "1993", independent: true },
    { id: 4, name: "A. Brooke Seawell", en: "", role: "独立董事", since: "1997", independent: true },
    { id: 5, name: "Mark A. Stevens", en: "", role: "独立董事", since: "2008", independent: true },
    { id: 6, name: "Dawn Hudson", en: "", role: "独立董事", since: "2013", independent: true },
    { id: 7, name: "Stephen C. Neal", en: "", role: "首席独立董事", since: "2019", independent: true },
    { id: 8, name: "John O. Dabiri", en: "", role: "独立董事", since: "2020", independent: true },
    { id: 9, name: "Aarti Shah", en: "", role: "独立董事", since: "2020", independent: true },
    { id: 10, name: "Melissa B. Lora", en: "", role: "独立董事", since: "2023", independent: true },
    { id: 11, name: "Suzanne Nora Johnson", en: "", role: "独立董事 · 新增席位", since: "2026-07", independent: true, isNew: true },
  ],
};

export type TimelineItem = {
  date: string;
  title: string;
  detail: string;
  cls: SourceClass;
  src: string;
};

export const TIMELINE: TimelineItem[] = [
  { date: "2025-04", title: "H20 对华出口需许可证", detail: "美国政府要求H20出口许可；英伟达披露约55亿美元相关费用。", cls: "confirmed", src: "NVIDIA 8-K / 公开披露" },
  { date: "2025-07", title: "H20 获准恢复销售", detail: "英伟达称已获美方保证将签发许可证，H20恢复对华销售。", cls: "confirmed", src: "NVIDIA 公开声明" },
  { date: "2025-12", title: "H200 获准出口获批中国客户", detail: "美国总统宣布允许H200向经审批的中国客户出口。", cls: "confirmed", src: "美国政府公开表态" },
  { date: "2026-10-29", title: "黄仁勋回应 Megaspeed 关系", detail: "彭博社报道：黄仁勋称公司与Megaspeed高管的往来属正常业务。", cls: "media", src: "Bloomberg" },
  { date: "2026-11 初", title: "\"中国情报资产\"指控", detail: "媒体援引美情报备忘录称Megaspeed高管Alice Huang为中国情报资产；无公开证据，当事方否认。", cls: "unverified", src: "CNN / The Information 等报道" },
  { date: "2026-11-08", title: "道歉信 · 董事会启动独立调查", detail: "黄仁勋致员工信承认婚外情并道歉；董事会称将由独立董事委员会牵头独立调查。", cls: "confirmed", src: "NVIDIA 新闻稿" },
  { date: "2026-11-10", title: "独立董事聘请外部律所", detail: "独立董事聘请前纽约南区代理联邦检察官 Joon H. Kim 及 Wachtell Lipton 主导调查。", cls: "confirmed", src: "NVIDIA 新闻稿" },
  { date: "2026-11-11", title: "国会压力升级", detail: "多名议员呼吁黄仁勋辞职，并推动收紧AI芯片出口管制。", cls: "media", src: "CNBC 等报道" },
  { date: "2026-11-11/12", title: "黄仁勋辞任", detail: "11日董事会接受其辞去总裁、CEO及董事职务，即时生效；12日公告：Colette Kress 代理CEO，Harvey C. Jones 任首任董事长。", cls: "confirmed", src: "NVIDIA 8-K (事件日 11-11) / 新闻稿 (11-12)" },
];

export const SOURCES = [
  "NVIDIA DEF 14A（2026-05-12）：持股表，截至2026-03-23",
  "NVIDIA 8-K（2026-06-24）：股东大会投票结果",
  "NVIDIA 8-K（事件日 2026-11-11）· 新闻稿（11-08 / 11-10 / 11-12）",
  "Bloomberg · CNN · CNBC · CBS News（媒体报道，已标注）",
];
