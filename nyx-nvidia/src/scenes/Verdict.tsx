import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { C, F, W } from "../theme";
import { Atmosphere, Eyebrow, Rise, Tag } from "../components/ui";

export const Verdict: React.FC = () => {
  const frame = useCurrentFrame();
  const neq = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.4)) });
  const pulse = 0.5 + 0.5 * Math.sin(frame / 5);
  const pillars = ["股东的选票", "独立的董事会", "可被替换的 CEO"];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Atmosphere />
      <div style={{ position: "absolute", top: 190, left: 90, right: 90 }}>
        <Rise from={0}><Eyebrow>Verdict · 结论</Eyebrow></Rise>
      </div>
      <div style={{ position: "absolute", top: 420, width: W, textAlign: "center" }}>
        <Rise from={4}>
          <div style={{ fontFamily: F.num, fontWeight: 900, fontSize: 170, color: C.gold, lineHeight: 1, letterSpacing: -6 }}>3.58%</div>
        </Rise>
        <div style={{ fontFamily: F.num, fontWeight: 900, fontSize: 120, color: C.unverified, lineHeight: 1, marginTop: 10, opacity: neq, transform: `scale(${neq})` }}>≠</div>
        <Rise from={44}>
          <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 96, color: C.ink, lineHeight: 1.1, marginTop: 10, letterSpacing: 8 }}>控制权</div>
        </Rise>
      </div>
      <div style={{ position: "absolute", top: 1000, left: 90, right: 90 }}>
        {pillars.map((p, i) => (
          <Rise key={p} from={80 + i * 18}>
            <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 22 }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", border: `2px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.num, fontWeight: 900, fontSize: 28, color: C.gold }}>{i + 1}</div>
              <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 52, color: C.ink }}>{p}</div>
            </div>
          </Rise>
        ))}
        <Rise from={150}>
          <div style={{ marginTop: 20, padding: "22px 28px", borderRadius: 14, border: `1.5px solid ${C.unverified}`, background: `rgba(196,85,63,${0.06 + 0.04 * pulse})` }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Tag cls="unverified" />
              <span style={{ fontFamily: F.sans, fontSize: 24, color: C.muted }}>审慎声明</span>
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 27, color: C.ink, lineHeight: 1.6, marginTop: 10 }}>
              关于"情报资产"与出口违规的说法均为媒体报道或指控，尚无公开证据，独立调查仍在进行。本片不作有罪推定。
            </div>
          </div>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};
