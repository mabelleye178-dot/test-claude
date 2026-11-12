import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { C, F, W } from "../theme";
import { Atmosphere, Eyebrow, Rise, GoldRule } from "../components/ui";

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const chars = ["黄", "仁", "勋", "的", "3.58%"];
  const q = "谁真正控制英伟达？";
  const qA = interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const grid = interpolate(frame, [0, 220], [0, -120], { extrapolateRight: "clamp" });
  const diag = interpolate(frame, [0, 220], [-200, 1300], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* slow drifting grid */}
      <div
        style={{
          position: "absolute",
          inset: -200,
          backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
          backgroundSize: "120px 120px",
          opacity: 0.35,
          transform: `translateY(${grid}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -300,
          top: diag,
          width: W + 600,
          height: 140,
          background: `linear-gradient(180deg, transparent, rgba(201,169,110,0.10), transparent)`,
          transform: "rotate(-12deg)",
        }}
      />
      <Atmosphere />

      <div style={{ position: "absolute", top: 520, left: 90, right: 90 }}>
        <Rise from={0}>
          <Eyebrow>Nyx Lab · 金融纪录片</Eyebrow>
        </Rise>
        <GoldRule from={10} style={{ marginTop: 28 }} />
        <div style={{ marginTop: 44, display: "flex", flexWrap: "wrap" }}>
          {chars.map((ch, i) => {
            const a = interpolate(frame, [14 + i * 4, 30 + i * 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const y = interpolate(frame, [14 + i * 4, 30 + i * 4], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
            const isNum = /[0-9.%]/.test(ch);
            // keep the number as one unbreakable unit
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  fontFamily: isNum ? F.num : F.serif,
                  fontWeight: 900,
                  fontSize: 122,
                  lineHeight: 1.1,
                  color: isNum ? C.gold : C.ink,
                  opacity: a,
                  transform: `translateY(${y}px)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: F.serif,
            fontWeight: 600,
            fontSize: 70,
            color: C.ink,
            opacity: qA,
            letterSpacing: 6,
          }}
        >
          {q}
        </div>
        <Rise from={100}>
          <div style={{ marginTop: 50, fontFamily: F.sans, fontSize: 28, color: C.muted, lineHeight: 1.8 }}>
            数据来源：2026年 SEC 股东委托书 · 8-K · NVIDIA 新闻稿
            <br />
            所有陈述按「已证实 / 媒体报道 / 未经证实」分级标注
          </div>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};
