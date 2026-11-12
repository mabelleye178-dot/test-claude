import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C, F, W } from "../theme";

export const BrandBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: W, opacity }}>
      <div style={{ position: "absolute", top: 0, left: 0, height: 3, width: W * progress, background: C.gold }} />
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 72,
          right: 72,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: F.sans,
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: 8,
          color: C.gold,
        }}
      >
        <span>NYX LAB</span>
        <span style={{ fontWeight: 400, letterSpacing: 3, color: C.muted, fontSize: 22 }}>动态信息可视化 · 2026</span>
      </div>
    </div>
  );
};
