import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F, W } from "../../theme";
import { Backdrop, Camera, E, Pill, Vignette, cue, cueEnd, lerp, tw } from "../shared";

const LINES = ["持有多少股份，", "和掌握多少权力，", "从来不是", "同一个问题。"];
const SOURCES = ["NVIDIA DEF 14A（2026-05-12）· 持股截至 2026-03-23", "NVIDIA 8-K（2026-06-24 · 2026-11-11）", "NVIDIA 新闻稿（11-08 · 11-10 · 11-12）", "Bloomberg 等媒体报道（已分级标注）"];

// 08 Conclusion — the line to remember, the caveat, then the Nyx Lab signature.
export const Conclusion: React.FC = () => {
  const f = useCurrentFrame();
  const tQ = cue("end.quote"), tN = cue("end.note"), tB = cue("end.brand");
  const qSpan = Math.max(30, cueEnd("end.quote") - tQ);
  const out = tw(f, tB - 12, 22, 0, 1, E.inOut);
  const brand = tw(f, tB, 30);
  const ring = tw(f, tB, 46, 0, 1, E.inOut);
  return (
    <AbsoluteFill>
      <Backdrop seed="end" grid={false} />
      <Camera keys={[{ f: 0, s: 1.04, cx: W / 2, cy: 960 }, { f: tB - 10, s: 1, cx: W / 2, cy: 960, dur: 60 }]} drift={0.00008}>
        <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateY(${-out * 40}px)` }}>
          <div style={{ position: "absolute", top: 300, left: 80, fontFamily: F.serif, fontWeight: 900, fontSize: 220, lineHeight: 1, color: C.gold, opacity: tw(f, tQ - 8, 20) * 0.9 }}>“</div>
          <div style={{ position: "absolute", top: 470, left: 80, right: 80 }}>
            {LINES.map((l, i) => {
              const p = tw(f, tQ + (i * qSpan) / 4.6, 22);
              return (
                <div key={i} style={{ overflow: "hidden", height: 136 }}>
                  <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 100, lineHeight: "136px", color: i === 3 ? C.gold : C.ink, transform: `translateY(${(1 - p) * 136}px)`, opacity: p }}>{l}</div>
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", top: 1110, left: 80, right: 80, padding: "26px 32px", borderRadius: 18, border: `1.5px solid ${C.unverified}`, background: "rgba(196,85,63,0.07)", opacity: tw(f, tN, 22), transform: `translateY(${(1 - tw(f, tN, 22)) * 30}px)` }}>
            <Pill kind="unverified" />
            <div style={{ fontFamily: F.sans, fontSize: 36, color: C.ink, lineHeight: 1.5, marginTop: 14 }}>独立调查仍在进行，相关指控尚无定论。<br /><span style={{ color: C.muted, fontSize: 30 }}>本片不作有罪推定。</span></div>
          </div>
        </div>
        {/* brand signature */}
        <div style={{ position: "absolute", inset: 0, opacity: brand }}>
          <svg width={W} height={1920} style={{ position: "absolute", top: 0, left: 0 }}>
            <circle cx={W / 2} cy={640} r={168} fill="none" stroke={C.gold} strokeWidth={2.5} strokeDasharray={`${1056 * ring} 1056`} transform={`rotate(-90 ${W / 2} 640)`} />
            <circle cx={W / 2} cy={640} r={136} fill="none" stroke={C.line} strokeWidth={1} opacity={ring} />
          </svg>
          <div style={{ position: "absolute", top: 580, width: W, textAlign: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 100, letterSpacing: 12, color: C.gold, transform: `scale(${lerp(0.9, 1, ring)})` }}>NYX</div>
          <div style={{ position: "absolute", top: 870, width: W, textAlign: "center", fontFamily: F.sans, fontSize: 32, letterSpacing: 14, color: C.ink, opacity: tw(f, tB + 14, 20) }}>NYX LAB</div>
          <div style={{ position: "absolute", top: 940, width: W, textAlign: "center", fontFamily: F.serif, fontWeight: 900, fontSize: 62, letterSpacing: 6, color: C.ink, opacity: tw(f, tB + 20, 22) }}>看见数字背后的结构</div>
          <div style={{ position: "absolute", top: 1110, left: 110, right: 110, opacity: tw(f, tB + 40, 24) }}>
            <div style={{ fontFamily: F.sans, fontSize: 23, color: C.gold, letterSpacing: 4, marginBottom: 10 }}>资料来源</div>
            {SOURCES.map((s) => (<div key={s} style={{ fontFamily: F.sans, fontSize: 24, color: C.muted, lineHeight: 1.7 }}>· {s}</div>))}
            <div style={{ fontFamily: F.sans, fontSize: 21, color: "#5d584e", marginTop: 14 }}>信息可视化作品，不构成投资建议 · 制作于 2026-11-13</div>
          </div>
        </div>
      </Camera>
      <Vignette />
    </AbsoluteFill>
  );
};
