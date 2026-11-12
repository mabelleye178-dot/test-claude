import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig, Easing } from "remotion";
import { C, F } from "../theme";

export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

// Eased count-up number. `from` frame relative to the scene.
export const CountUp: React.FC<{
  value: number;
  from?: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  style?: React.CSSProperties;
  grouping?: boolean;
}> = ({ value, from = 0, duration = 45, decimals = 0, suffix = "", prefix = "", style, grouping = true }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const v = value * t;
  const text = grouping
    ? v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : v.toFixed(decimals);
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", fontFamily: F.num, ...style }}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
};

export const useReveal = (from: number, opts?: { damping?: number; stiffness?: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - from, fps, config: { damping: opts?.damping ?? 200, stiffness: opts?.stiffness ?? 120 } });
};

// Fade+rise wrapper
export const Rise: React.FC<{ from: number; children: React.ReactNode; style?: React.CSSProperties; dy?: number; delayFrames?: number }> = ({
  from,
  children,
  style,
  dy = 40,
}) => {
  const p = useReveal(from);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * dy}px)`, ...style }}>{children}</div>
  );
};

export const Eyebrow: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      fontFamily: F.sans,
      fontWeight: 400,
      fontSize: 26,
      letterSpacing: 6,
      color: C.gold,
      textTransform: "uppercase",
      ...style,
    }}
  >
    {children}
  </div>
);

export const H1: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 72, lineHeight: 1.2, color: C.ink, ...style }}>{children}</div>
);

export const Body: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: F.sans, fontWeight: 400, fontSize: 30, lineHeight: 1.6, color: C.muted, ...style }}>{children}</div>
);

export const GoldRule: React.FC<{ from: number; width?: number; style?: React.CSSProperties }> = ({ from, width = 120, style }) => {
  const p = useReveal(from);
  return (
    <div
      style={{
        height: 2,
        width: width * p,
        background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`,
        ...style,
      }}
    />
  );
};

export const TAG_META = {
  confirmed: { label: "已证实 · 官方文件", color: C.confirmed },
  media: { label: "媒体报道", color: C.media },
  unverified: { label: "未经证实 · 指控", color: C.unverified },
} as const;

export const Tag: React.FC<{ cls: keyof typeof TAG_META; style?: React.CSSProperties }> = ({ cls, style }) => {
  const m = TAG_META[cls];
  return (
    <span
      style={{
        fontFamily: F.sans,
        fontWeight: 700,
        fontSize: 22,
        letterSpacing: 2,
        color: m.color,
        border: `1.5px solid ${m.color}`,
        borderRadius: 999,
        padding: "4px 14px",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {m.label}
    </span>
  );
};

// Subtle film grain + vignette overlay used on every scene
export const Atmosphere: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 35%, rgba(201,169,110,0.07), rgba(0,0,0,0) 60%), radial-gradient(ellipse 100% 100% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.045,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 3px)",
          transform: `translateY(${(frame % 3) - 1}px)`,
          pointerEvents: "none",
        }}
      />
    </>
  );
};
