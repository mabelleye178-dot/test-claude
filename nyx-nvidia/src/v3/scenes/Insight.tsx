import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F, W } from "../../theme";
import { Backdrop, Camera, E, Vignette, cue, lerp, tw } from "../shared";

const STEPS = ["所有权", "表决权", "董事会治理权", "经营管理权"];

// 07 Insight — the simplest frame of the film: Ownership ≠ Control, then the four-step ladder.
export const Insight: React.FC = () => {
  const f = useCurrentFrame();
  const tN = cue("ins.neq"), tS = cue("ins.start"), tR = cue("ins.rest");
  const a = tw(f, tN - 6, 22), neq = tw(f, tN + 16, 18, 0, 1, E.back), b = tw(f, tN + 28, 22);
  const shrink = tw(f, tS - 8, 30, 0, 1, E.inOut);
  return (
    <AbsoluteFill>
      <Backdrop seed="insight" grid={false} />
      <Camera keys={[{ f: 0, s: 1, cx: W / 2, cy: 960 }]} drift={0.00012}>
        <div style={{ position: "absolute", top: 230, left: 80, fontFamily: F.sans, fontWeight: 700, fontSize: 25, letterSpacing: 7, color: C.gold, opacity: a }}>INSIGHT · 商业洞察</div>
        <div style={{ position: "absolute", top: lerp(520, 330, shrink), width: W, textAlign: "center", transform: `scale(${lerp(1, 0.72, shrink)})`, transformOrigin: "50% 0" }}>
          <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 150, color: C.ink, lineHeight: 1.1, opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>所有权</div>
          <div style={{ fontFamily: F.num, fontWeight: 900, fontSize: 150, color: C.unverified, lineHeight: 1.05, opacity: neq, transform: `scale(${neq})` }}>≠</div>
          <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 150, color: C.gold, lineHeight: 1.1, opacity: b, transform: `translateY(${(1 - b) * -30}px)` }}>控制权</div>
          <div style={{ fontFamily: F.sans, fontSize: 30, letterSpacing: 8, color: C.muted, marginTop: 26, opacity: b }}>OWNERSHIP ≠ CONTROL</div>
        </div>
        {/* ladder */}
        <div style={{ position: "absolute", top: 830, left: 80, right: 80 }}>
          {STEPS.map((s, i) => {
            const at = i === 0 ? tS : tR + (i - 1) * 16;
            const p = tw(f, at, 24);
            const first = i === 0;
            return (
              <div key={s} style={{ marginLeft: i * 62, marginBottom: 20, height: 104, width: 734, borderRadius: 18, boxSizing: "border-box", padding: "0 34px", display: "flex", alignItems: "center", justifyContent: "space-between", border: `1.5px solid ${first ? C.gold : C.line}`, background: first ? "rgba(201,169,110,0.12)" : "rgba(255,255,255,0.03)", opacity: p, transform: `translateX(${(1 - p) * -50}px)` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <span style={{ fontFamily: F.num, fontWeight: 900, fontSize: 40, color: C.gold }}>{i + 1}</span>
                  <span style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 52, color: C.ink }}>{s}</span>
                </div>
                <span style={{ fontFamily: F.sans, fontSize: 28, color: first ? C.gold : C.muted }}>{first ? "起点 · 3.58%" : ["", "一股一票", "任免 CEO", "日常经营"][i]}</span>
              </div>
            );
          })}
        </div>
      </Camera>
      <Vignette />
    </AbsoluteFill>
  );
};
