import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F, W } from "../../theme";
import { Backdrop, Camera, Chapter, Count, E, Source, Vignette, cue, lerp, tw, win } from "../shared";

const CX = W / 2, CY = 690, R = 215;
const arc = (a: number, b: number) => {
  const p = (pct: number) => { const t = (pct / 100) * Math.PI * 2 - Math.PI / 2; return [CX + R * Math.cos(t), CY + R * Math.sin(t)]; };
  const [x1, y1] = p(a), [x2, y2] = p(b);
  return `M ${x1} ${y1} A ${R} ${R} 0 ${b - a > 50 ? 1 : 0} 1 ${x2} ${y2}`;
};

// 02 Ownership → Voting power. One focus at a time, following the narration.
export const Ownership: React.FC = () => {
  const f = useCurrentFrame();
  const tH = cue("own.huang"), tF = cue("own.funds"), tI = cue("own.insiders"), tV = cue("own.vote1"), tV2 = cue("own.vote2");
  const draw = tw(f, 10, 50);
  const w0 = 1 - tw(f, tH, 12), wH = win(f, tH, tF), wF = win(f, tF, tI), wI = win(f, tI, tV + 30);
  const segs = [
    { k: "h", a: 0, b: 3.58, col: C.gold, w: 46, on: Math.max(wH, wI) },
    { k: "i", a: 3.58, b: 3.94, col: C.goldDark, w: 46, on: wI },
    { k: "v", a: 3.94, b: 11.25, col: "#B9A27A", w: 34, on: wF },
    { k: "b", a: 11.25, b: 18.68, col: "#9A8660", w: 34, on: wF },
    { k: "p", a: 18.68, b: 100, col: "#4A463E", w: 20, on: 0 },
  ];
  const centre = [
    { on: w0, big: "243亿", sub: "总股本（股）", col: C.ink },
    { on: wH, big: "3.58%", sub: "黄仁勋 · 约8.7亿股", col: C.gold },
    { on: wF, big: "14.74%", sub: "先锋领航 + 贝莱德", col: C.ink },
    { on: wI, big: "3.94%", sub: "全体董事及高管", col: C.ink },
  ];
  const rows = [
    { at: tH, on: wH, label: "黄仁勋", sub: "创始人", pct: 3.58, gold: true },
    { at: tF, on: wF, label: "贝莱德 BlackRock", sub: "指数基金", pct: 7.43 },
    { at: tF + 8, on: wF, label: "先锋领航 Vanguard", sub: "指数基金", pct: 7.31 },
    { at: tI, on: wI, label: "全体董事及高管", sub: "含黄仁勋", pct: 3.94 },
  ];
  const ownA = 1 - tw(f, tV - 8, 16), voteA = tw(f, tV + 4, 18);
  const eq = tw(f, tV2, 22);
  const zoom = lerp(1, 1.15, tw(f, tH - 4, 40, 0, 1, E.inOut) * (1 - tw(f, tF - 8, 36, 0, 1, E.inOut)));
  return (
    <AbsoluteFill>
      <Backdrop seed="own" />
      <Camera keys={[{ f: 0, s: 1, cx: CX, cy: 960 }]}>
        <Chapter en="OWNERSHIP" cn="所有权" opacity={ownA} />
        <Chapter en="VOTING POWER" cn="表决权" at={tV} opacity={voteA} />
        {/* ownership block */}
        <div style={{ position: "absolute", inset: 0, opacity: ownA, transform: `translateY(${(1 - ownA) * -40}px)` }}>
          <div style={{ position: "absolute", inset: 0, transformOrigin: `${CX}px ${CY}px`, transform: `scale(${zoom})` }}>
          <svg width={W} height={1000} style={{ position: "absolute", top: 0, left: 0 }}>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={20} />
            {segs.map((s) => {
              const end = s.a + (s.b - s.a) * Math.min(1, Math.max(0, (draw * 100 - s.a) / (s.b - s.a)));
              if (end <= s.a) return null;
              const op = 0.28 + 0.72 * Math.max(w0 * 0.75, s.on);
              return <path key={s.k} d={arc(s.a, end)} stroke={s.col} strokeWidth={s.w + 8 * s.on} fill="none" opacity={op} />;
            })}
            <path d={arc(0, 3.58)} stroke={C.goldLight} strokeWidth={56} fill="none" opacity={0.3 * wH * (0.55 + 0.45 * Math.sin(f / 5))} />
          </svg>
          {centre.map((c, i) => (
            <div key={i} style={{ position: "absolute", top: CY - 72, left: 0, width: W, textAlign: "center", opacity: c.on, transform: `scale(${lerp(0.92, 1, c.on)})` }}>
              <div style={{ fontFamily: F.num, fontWeight: 900, fontSize: 104, lineHeight: 1, color: c.col, letterSpacing: -3 }}>{c.big}</div>
              <div style={{ fontFamily: F.sans, fontSize: 30, color: C.muted, marginTop: 14, letterSpacing: 2 }}>{c.sub}</div>
            </div>
          ))}
          </div>
          <div style={{ position: "absolute", top: 985, left: 80, right: 80 }}>
            {rows.map((r, i) => {
              const p = tw(f, r.at, 22);
              const op = p * lerp(0.34, 1, r.on);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", height: 88, opacity: op, transform: `translateX(${(1 - p) * -36}px)` }}>
                  <div style={{ width: 380 }}>
                    <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 36, color: r.gold ? C.gold : C.ink, whiteSpace: "nowrap" }}>{r.label}</div>
                  </div>
                  <div style={{ flex: 1, height: 16, background: "rgba(255,255,255,0.07)", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ width: `${(r.pct / 8.2) * 100 * p}%`, height: "100%", borderRadius: 8, background: r.gold ? `linear-gradient(90deg, ${C.goldDark}, ${C.gold})` : "#9A8660" }} />
                  </div>
                  <div style={{ width: 190, textAlign: "right", fontFamily: F.num, fontWeight: 900, fontSize: 50, color: r.gold ? C.gold : C.ink }}>
                    <Count to={r.pct} at={r.at} dur={26} dec={2} suffix="%" />
                  </div>
                </div>
              );
            })}
          </div>
          <Source kind="confirmed" style={{ position: "absolute", top: 1352, left: 80, opacity: tw(f, tH, 20) }}>DEF 14A · 截至 2026-03-23</Source>
        </div>
        {/* voting-power block */}
        <div style={{ position: "absolute", inset: 0, opacity: voteA }}>
          <div style={{ position: "absolute", top: 520, width: W, display: "flex", justifyContent: "center", alignItems: "center", gap: 44, fontFamily: F.serif, fontWeight: 900, fontSize: 170, color: C.ink, transform: `translateY(${(1 - voteA) * 40}px) scale(${lerp(1, 0.8, eq)})`, transformOrigin: "50% 0" }}>
            <span>1股</span><span style={{ color: C.gold, fontFamily: F.num }}>=</span><span>1票</span>
          </div>
          <div style={{ position: "absolute", top: lerp(790, 740, eq), width: W, display: "flex", justifyContent: "center", gap: 18, opacity: tw(f, tV + 40, 20) }}>
            {["单一类别普通股", "无双层股权", "无超级投票权"].map((t) => (
              <span key={t} style={{ fontFamily: F.sans, fontSize: 30, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 999, padding: "10px 24px" }}>{t}</span>
            ))}
          </div>
          <div style={{ position: "absolute", top: 900, left: 80, right: 80, display: "flex", alignItems: "stretch", justifyContent: "space-between", opacity: eq, transform: `translateY(${(1 - eq) * 40}px)` }}>
            {[{ t: "所有权", gold: false }, { t: "表决权", gold: true }].map((b, i) => (
              <div key={i} style={{ width: 400, height: 300, borderRadius: 22, border: `1.5px solid ${b.gold ? C.gold : C.line}`, background: b.gold ? "rgba(201,169,110,0.10)" : "rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `translateX(${(1 - tw(f, tV2 + i * 10, 26, 0, 1, E.back)) * (i ? 60 : -60)}px)` }}>
                <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 52, color: C.ink }}>{b.t}</div>
                <div style={{ fontFamily: F.num, fontWeight: 900, fontSize: 104, color: b.gold ? C.gold : C.ink, marginTop: 8 }}>3.58%</div>
              </div>
            ))}
            <div style={{ position: "absolute", left: 0, right: 0, top: 96, textAlign: "center", fontFamily: F.num, fontWeight: 900, fontSize: 96, color: C.gold }}>=</div>
          </div>
          <Source kind="confirmed" style={{ position: "absolute", top: 1270, left: 80, opacity: eq }}>DEF 14A · 每股普通股一票</Source>
        </div>
      </Camera>
      <Vignette />
    </AbsoluteFill>
  );
};
