import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F, W } from "../../theme";
import { Backdrop, Camera, Chapter, E, Pill, Vignette, cue, lerp, tw, win } from "../shared";

const NODES = [
  { key: "sh", title: "股东", sub: "持有全部股份", tag: "① 所有权　② 表决权" },
  { key: "bd", title: "董事会", sub: "11 席 · 每年改选", tag: "③ 治理权" },
  { key: "ceo", title: "CEO", sub: "由董事会任命", tag: "④ 经营管理权" },
  { key: "mg", title: "管理层", sub: "执行经营决策", tag: "执行" },
];
const NX = 150, NW = 780, NH = 158, NT = 420, STEP = 238; // node i top = NT + i*STEP, gap = 80
const DOWN = ["选举 · 罢免", "任免 · 监督", "领导 · 授权"];
const UP = ["对股东负责", "对董事会负责", "向 CEO 汇报"];

// 04 Power structure — the key explainer: four layers, authority flows down, accountability flows back up.
export const Power: React.FC = () => {
  const f = useCurrentFrame();
  const t = [cue("pow.sh"), cue("pow.board"), cue("pow.ceo"), cue("pow.ceo") + 26];
  const tB = cue("pow.back"), tF = cue("pow.founder");
  const mid = (i: number) => NT + i * STEP + NH / 2;
  return (
    <AbsoluteFill>
      <Backdrop seed="power" />
      <Camera
        keys={[
          { f: 0, s: 1, cx: W / 2, cy: 960 },
          { f: t[0] - 6, s: 1.2, cx: W / 2, cy: mid(0) + 150, dur: 40 },
          { f: t[1] - 6, s: 1.2, cx: W / 2, cy: mid(1) + 90, dur: 40 },
          { f: t[2] - 6, s: 1.16, cx: W / 2, cy: mid(2) + 110, dur: 40 },
          { f: tB - 8, s: 1, cx: W / 2, cy: 960, dur: 44 },
        ]}
      >
        <Chapter en="POWER STRUCTURE" cn="四层权力结构" opacity={1 - tw(f, t[0] - 10, 16) * (1 - tw(f, tB - 4, 24))} />
        {NODES.map((n, i) => {
          const on = tw(f, t[i], 22);
          const focus = i < 3 ? win(f, t[i], i < 2 ? t[i + 1] : tB) : win(f, t[3], tB);
          const founder = n.key === "ceo" ? tw(f, tF, 20) : 0;
          const hot = Math.max(focus, founder);
          return (
            <div key={n.key} style={{ position: "absolute", left: NX, top: NT + i * STEP, width: NW, height: NH, perspective: 900 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 20, border: "2px dashed rgba(201,169,110,0.4)", opacity: tw(f, 6 + i * 5, 16) * (1 - on) }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 20, boxSizing: "border-box", padding: "0 38px", display: "flex", alignItems: "center", justifyContent: "space-between", border: `${1.5 + hot}px solid ${hot > 0.3 ? C.gold : "rgba(201,169,110,0.34)"}`, background: `rgba(201,169,110,${0.04 + 0.1 * hot})`, opacity: on * lerp(0.55, 1, Math.max(hot, tw(f, tB, 20))), transform: `translateY(${(1 - on) * 26}px) rotateX(${(1 - on) * 18}deg)`, boxShadow: `0 ${18 * hot}px ${50 * hot}px rgba(201,169,110,${0.22 * hot})` }}>
                <div>
                  <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 62, color: hot > 0.3 ? C.gold : C.ink, lineHeight: 1.1 }}>{n.title}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 27, color: C.muted, marginTop: 6 }}>{n.sub}</div>
                </div>
                <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: C.goldLight, whiteSpace: "nowrap" }}>{n.tag}</div>
              </div>
            </div>
          );
        })}
        <svg width={W} height={1920} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
          {[0, 1, 2].map((i) => {
            const y1 = NT + i * STEP + NH + 6, y2 = NT + (i + 1) * STEP - 6;
            const d = tw(f, t[i] + 26, 22, 0, 1, E.inOut), u = tw(f, tB + 10 + (2 - i) * 14, 24, 0, 1, E.inOut);
            return (
              <g key={i}>
                <line x1={330} y1={y1} x2={330} y2={y1 + (y2 - y1) * d} stroke={C.gold} strokeWidth={4} strokeDasharray="12 10" strokeDashoffset={-f * 1.4} />
                {d > 0.95 ? <polygon points={`318,${y2 - 16} 342,${y2 - 16} 330,${y2}`} fill={C.gold} /> : null}
                <line x1={750} y1={y2} x2={750} y2={y2 - (y2 - y1) * u} stroke={C.media} strokeWidth={4} strokeDasharray="4 10" strokeDashoffset={f * 1.4} opacity={0.95} />
                {u > 0.95 ? <polygon points={`738,${y1 + 16} 762,${y1 + 16} 750,${y1}`} fill={C.media} /> : null}
              </g>
            );
          })}
        </svg>
        {[0, 1, 2].map((i) => {
          const y = NT + i * STEP + NH + 22;
          return (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", top: y, left: 356, fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: C.goldLight, opacity: tw(f, t[i] + 30, 18), whiteSpace: "nowrap" }}>{DOWN[i]}</div>
              <div style={{ position: "absolute", top: y, left: 776, fontFamily: F.sans, fontWeight: 700, fontSize: 26, color: C.media, opacity: tw(f, tB + 14 + (2 - i) * 14, 18), whiteSpace: "nowrap" }}>{UP[i]}</div>
            </React.Fragment>
          );
        })}
        <div style={{ position: "absolute", top: 1318, left: 80, right: 80, opacity: tw(f, tF, 20), transform: `translateY(${(1 - tw(f, tF, 20)) * 20}px)`, display: "flex", alignItems: "center", gap: 18 }}>
          <Pill kind="analysis" />
          <span style={{ fontFamily: F.sans, fontSize: 30, color: C.ink }}>影响力 ≠ 股权 · 来自业绩与信任</span>
        </div>
      </Camera>
      <Vignette />
    </AbsoluteFill>
  );
};
