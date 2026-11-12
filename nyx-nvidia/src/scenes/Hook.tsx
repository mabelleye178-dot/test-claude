import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { C, F, W } from "../theme";
import { Atmosphere, CountUp } from "../components/ui";

// 0–6s: visual hook. A single number fills the frame.
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  // pulse ring expands
  const ring = interpolate(frame, [0, 60], [0.2, 1.6], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const ringA = interpolate(frame, [0, 10, 60], [0, 0.6, 0], { extrapolateRight: "clamp" });
  const numScale = interpolate(frame, [0, 50], [1.25, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const numA = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const flash = interpolate(frame, [44, 48, 70], [0, 0.35, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineW = interpolate(frame, [48, 80], [0, 520], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const subA = interpolate(frame, [60, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subY = interpolate(frame, [60, 80], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const tickerA = interpolate(frame, [95, 115], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shimmer = (frame * 6) % 1400;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Atmosphere />
      {/* expanding ring */}
      <div
        style={{
          position: "absolute",
          left: W / 2 - 400,
          top: 760 - 400,
          width: 800,
          height: 800,
          borderRadius: "50%",
          border: `2px solid ${C.gold}`,
          opacity: ringA,
          transform: `scale(${ring})`,
        }}
      />
      {/* flash */}
      <AbsoluteFill style={{ background: C.goldLight, opacity: flash, mixBlendMode: "screen" }} />

      {/* the number */}
      <div
        style={{
          position: "absolute",
          top: 560,
          width: W,
          textAlign: "center",
          opacity: numA,
          transform: `scale(${numScale})`,
        }}
      >
        <div
          style={{
            fontFamily: F.num,
            fontWeight: 900,
            fontSize: 300,
            lineHeight: 1,
            letterSpacing: -12,
            backgroundImage: `linear-gradient(100deg, ${C.goldDark} 0%, ${C.gold} 35%, ${C.goldLight} 50%, ${C.gold} 65%, ${C.goldDark} 100%)`,
            backgroundSize: "1400px 100%",
            backgroundPosition: `${shimmer - 700}px 0`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          <CountUp value={3.58} decimals={2} duration={46} suffix="%" grouping={false} />
        </div>
      </div>

      <div style={{ position: "absolute", top: 905, left: (W - lineW) / 2, width: lineW, height: 2, background: C.gold }} />

      <div
        style={{
          position: "absolute",
          top: 950,
          width: W,
          textAlign: "center",
          opacity: subA,
          transform: `translateY(${subY}px)`,
          fontFamily: F.serif,
          fontWeight: 900,
          fontSize: 64,
          color: C.ink,
          letterSpacing: 4,
        }}
      >
        一个人的全部持股
      </div>
      <div
        style={{
          position: "absolute",
          top: 1050,
          width: W,
          textAlign: "center",
          opacity: subA,
          fontFamily: F.sans,
          fontWeight: 400,
          fontSize: 30,
          color: C.muted,
          letterSpacing: 6,
        }}
      >
        NVIDIA · 黄仁勋 · 2026
      </div>

      {/* ticker-style data strip */}
      <div
        style={{
          position: "absolute",
          top: 1230,
          width: W,
          display: "flex",
          justifyContent: "center",
          gap: 60,
          opacity: tickerA,
          fontFamily: F.sans,
          fontSize: 26,
          color: C.muted,
          letterSpacing: 2,
        }}
      >
        <span>
          <span style={{ color: C.gold, fontWeight: 700 }}>870,604,104</span> 股
        </span>
        <span>
          总股本 <span style={{ color: C.gold, fontWeight: 700 }}>24,312,141,810</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
