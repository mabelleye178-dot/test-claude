import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { C, F, W } from "../theme";
import { Atmosphere, Rise } from "../components/ui";
import { SOURCES } from "../data";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const ring = interpolate(frame, [0, 40], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const rot = frame * 0.6;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Atmosphere />
      <svg width={W} height={1920} style={{ position: "absolute", top: 0, left: 0 }}>
        <circle cx={W / 2} cy={620} r={150} fill="none" stroke={C.gold} strokeWidth={2} strokeDasharray={`${942 * ring} 942`} transform={`rotate(${-90 + rot} ${W / 2} 620)`} />
        <circle cx={W / 2} cy={620} r={120} fill="none" stroke={C.line} strokeWidth={1} />
      </svg>
      <div style={{ position: "absolute", top: 560, width: W, textAlign: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 90, color: C.gold, letterSpacing: 10, opacity: ring }}>NYX</div>
      <Rise from={20}>
        <div style={{ position: "absolute", top: 830, width: W, textAlign: "center", fontFamily: F.sans, fontWeight: 400, fontSize: 30, color: C.ink, letterSpacing: 12 }}>NYX LAB</div>
      </Rise>
      <Rise from={30}>
        <div style={{ position: "absolute", top: 900, width: W, textAlign: "center", fontFamily: F.serif, fontWeight: 600, fontSize: 46, color: C.ink, letterSpacing: 6 }}>看见数字背后的结构</div>
      </Rise>
      <div style={{ position: "absolute", top: 1080, left: 110, right: 110 }}>
        <Rise from={45}>
          <div style={{ fontFamily: F.sans, fontSize: 22, color: C.gold, letterSpacing: 4, marginBottom: 14 }}>资料来源</div>
        </Rise>
        {SOURCES.map((s, i) => (
          <Rise key={i} from={52 + i * 8}>
            <div style={{ fontFamily: F.sans, fontSize: 23, color: C.muted, lineHeight: 1.7 }}>· {s}</div>
          </Rise>
        ))}
        <Rise from={100}>
          <div style={{ fontFamily: F.sans, fontSize: 20, color: C.dim, marginTop: 24, lineHeight: 1.6 }}>
            本片为信息可视化作品，不构成投资建议。持股比例截至 2026-03-23，其后可能变动。制作日期 2026-11-12。
          </div>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};
