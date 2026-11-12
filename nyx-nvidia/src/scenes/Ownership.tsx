import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { C, F, W } from "../theme";
import { Atmosphere, CountUp, Eyebrow, Rise, Tag, fmtInt } from "../components/ui";
import { OWNERSHIP } from "../data";

const R = 250;
const CX = W / 2;
const CY = 720;

const arcPath = (startPct: number, endPct: number, r: number) => {
  const s = (startPct / 100) * Math.PI * 2 - Math.PI / 2;
  const e = (endPct / 100) * Math.PI * 2 - Math.PI / 2;
  const x1 = CX + r * Math.cos(s), y1 = CY + r * Math.sin(s);
  const x2 = CX + r * Math.cos(e), y2 = CY + r * Math.sin(e);
  const large = endPct - startPct > 50 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
};

export const Ownership: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [20, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const segs = [
    { key: "huang", pct: 3.58, color: C.gold, width: 44 },
    { key: "insiders", pct: 3.94 - 3.58, color: C.goldDark, width: 44 },
    { key: "vanguard", pct: 7.31, color: "#B9A27A", width: 30 },
    { key: "blackrock", pct: 7.43, color: "#8F7D5E", width: 30 },
    { key: "public", pct: 100 - 3.94 - 7.31 - 7.43, color: C.dim, width: 18 },
  ];
  let acc = 0;
  const pieces = segs.map((s) => {
    const start = acc;
    acc += s.pct;
    const end = Math.min(acc, start + s.pct * t);
    return { ...s, start, end };
  });
  const rows = OWNERSHIP.rows;
  const highlight = interpolate(frame, [120, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Atmosphere />
      <div style={{ position: "absolute", top: 190, left: 90, right: 90 }}>
        <Rise from={0}>
          <Eyebrow>Ownership · 股权结构</Eyebrow>
        </Rise>
        <Rise from={6}>
          <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 64, color: C.ink, marginTop: 18 }}>谁持有英伟达？</div>
        </Rise>
        <Rise from={12}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 14 }}>
            <Tag cls="confirmed" />
            <span style={{ fontFamily: F.sans, fontSize: 24, color: C.muted }}>DEF 14A · 截至 {OWNERSHIP.asOf}</span>
          </div>
        </Rise>
      </div>

      <svg width={W} height={1000} style={{ position: "absolute", top: 0, left: 0 }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={18} />
        {pieces.map((p) =>
          p.end > p.start ? (
            <path key={p.key} d={arcPath(p.start, p.end, R)} stroke={p.color} strokeWidth={p.width} fill="none" strokeLinecap="butt" />
          ) : null,
        )}
        {/* highlight glow on Huang slice */}
        <path d={arcPath(0, 3.58, R)} stroke={C.goldLight} strokeWidth={48} fill="none" opacity={0.35 * highlight * (0.5 + 0.5 * Math.sin(frame / 6))} />
      </svg>

      {/* center label */}
      <div style={{ position: "absolute", top: CY - 95, left: 0, width: W, textAlign: "center" }}>
        <div style={{ fontFamily: F.num, fontWeight: 900, fontSize: 120, color: C.gold, lineHeight: 1, letterSpacing: -4 }}>
          <CountUp value={3.58} decimals={2} from={20} duration={90} suffix="%" grouping={false} />
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 30, color: C.muted, marginTop: 12, letterSpacing: 4 }}>黄仁勋 · 实益持股</div>
      </div>

      {/* rows */}
      <div style={{ position: "absolute", top: 1030, left: 90, right: 90 }}>
        {rows.map((r, i) => {
          const from = 60 + i * 18;
          const p = interpolate(frame, [from, from + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          const barW = (r.pct / 10) * 540;
          const isH = r.key === "huang";
          return (
            <div key={r.key} style={{ display: "flex", alignItems: "center", marginBottom: 22, opacity: p, transform: `translateX(${(1 - p) * -30}px)` }}>
              <div style={{ width: 370 }}>
                <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: isH ? C.gold : C.ink, whiteSpace: "nowrap" }}>{r.label}</div>
                <div style={{ fontFamily: F.sans, fontSize: 22, color: C.muted, marginTop: 2 }}>
                  {r.shares ? `${fmtInt(r.shares)} 股` : r.sub}
                </div>
              </div>
              <div style={{ flex: 1, height: 14, background: "rgba(255,255,255,0.06)", borderRadius: 7, overflow: "hidden" }}>
                <div style={{ width: barW * p, height: "100%", background: isH ? `linear-gradient(90deg, ${C.goldDark}, ${C.gold})` : "#8F7D5E", borderRadius: 7 }} />
              </div>
              <div style={{ width: 150, textAlign: "right", fontFamily: F.num, fontWeight: 900, fontSize: 40, color: isH ? C.gold : C.ink }}>
                <CountUp value={r.pct} decimals={2} from={from} duration={40} suffix="%" grouping={false} />
              </div>
            </div>
          );
        })}
        <Rise from={150}>
          <div style={{ fontFamily: F.sans, fontSize: 22, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
            总股本 {fmtInt(OWNERSHIP.sharesOutstanding)} 股 · 贝莱德比例按委托书披露 · 其余约81%为其他机构与公众持有
          </div>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};
