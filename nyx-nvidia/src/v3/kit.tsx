import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { C, F, W, H } from "../theme";

export const E = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  back: Easing.out(Easing.back(1.4)),
};
export const tw = (f: number, from: number, dur = 18, a = 0, b = 1, easing: (n: number) => number = E.out) =>
  interpolate(f, [from, from + dur], [a, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 1 while frame is inside [a, b), with soft edges. */
export const win = (f: number, a: number, b: number, d = 12) => tw(f, a, d) * (1 - tw(f, b, d));

// ---------- camera ----------
export type CamKey = { f: number; s: number; cx: number; cy: number; dur?: number };
/** 2.5D camera: scales/pans the stage toward a focus point. Keys are applied in order with eased moves. */
export const Camera: React.FC<{ keys: CamKey[]; drift?: number; children: React.ReactNode }> = ({ keys, drift = 0, children }) => {
  const f = useCurrentFrame();
  let s = keys[0].s, cx = keys[0].cx, cy = keys[0].cy;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    const t = tw(f, k.f, k.dur ?? 34, 0, 1, E.inOut);
    s = lerp(s, k.s, t); cx = lerp(cx, k.cx, t); cy = lerp(cy, k.cy, t);
  }
  s *= 1 + drift * f;
  return (
    <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${W / 2 - cx * s}px, ${H / 2 - cy * s}px) scale(${s})` }}>
      {children}
    </AbsoluteFill>
  );
};

// ---------- backdrop with depth ----------
export const Backdrop: React.FC<{ seed?: string; grid?: boolean }> = ({ seed = "nyx", grid = true }) => {
  const f = useCurrentFrame();
  const dots = new Array(34).fill(0).map((_, i) => {
    const depth = 0.3 + random(seed + "d" + i) * 0.7; // 0.3 far .. 1 near
    const x = random(seed + "x" + i) * W;
    const y0 = random(seed + "y" + i) * H;
    const y = (((y0 - f * 0.35 * depth) % H) + H) % H;
    const size = 3 + depth * 9;
    const a = (0.05 + 0.16 * depth) * (0.6 + 0.4 * Math.sin(f / 30 + i));
    return { x: x + Math.sin(f / 90 + i) * 12 * depth, y, size, a };
  });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {grid ? (
        <div
          style={{
            position: "absolute", inset: -240, opacity: 0.22,
            backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
            backgroundSize: "135px 135px",
            transform: `translateY(${-(f * 0.18) % 135}px)`,
            maskImage: "radial-gradient(ellipse 70% 55% at 50% 42%, #000 0%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 42%, #000 0%, transparent 78%)",
          }}
        />
      ) : null}
      {dots.map((d, i) => (
        <div key={i} style={{ position: "absolute", left: d.x, top: d.y, width: d.size, height: d.size, borderRadius: "50%", background: `radial-gradient(circle, rgba(235,220,182,${d.a}) 0%, rgba(201,169,110,0) 70%)` }} />
      ))}
    </AbsoluteFill>
  );
};

// ---------- typography helpers ----------
export const Chapter: React.FC<{ en: string; cn: string; at?: number; opacity?: number }> = ({ en, cn, at = 0, opacity = 1 }) => {
  const f = useCurrentFrame();
  const p = tw(f, at, 20);
  return (
    <div style={{ position: "absolute", top: 196, left: 80, right: 80, opacity: p * opacity, transform: `translateY(${(1 - p) * 24}px)` }}>
      <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 25, letterSpacing: 7, color: C.gold }}>{en}</div>
      <div style={{ width: 96 * p, height: 2, background: C.gold, marginTop: 16 }} />
      <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 68, color: C.ink, marginTop: 18, letterSpacing: 2 }}>{cn}</div>
    </div>
  );
};

const PILL = {
  confirmed: { label: "已证实 · 官方文件", color: C.gold },
  media: { label: "媒体报道", color: C.media },
  unverified: { label: "未经证实", color: C.unverified },
  analysis: { label: "分析观点 · Nyx Lab", color: C.goldLight },
} as const;
export type PillKind = keyof typeof PILL;
export const pillColor = (k: PillKind) => PILL[k].color;
export const Pill: React.FC<{ kind: PillKind; size?: number; style?: React.CSSProperties }> = ({ kind, size = 24, style }) => (
  <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: size, letterSpacing: 2, color: PILL[kind].color, border: `1.5px solid ${PILL[kind].color}`, borderRadius: 999, padding: `${size * 0.2}px ${size * 0.62}px`, whiteSpace: "nowrap", ...style }}>
    {PILL[kind].label}
  </span>
);

export const Source: React.FC<{ kind: PillKind; children: React.ReactNode; style?: React.CSSProperties }> = ({ kind, children, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, ...style }}>
    <Pill kind={kind} />
    <span style={{ fontFamily: F.sans, fontSize: 25, color: C.muted }}>{children}</span>
  </div>
);

/** Number that counts up from 0 starting at `at`. */
export const Count: React.FC<{ to: number; at: number; dur?: number; dec?: number; suffix?: string }> = ({ to, at, dur = 36, dec = 0, suffix = "" }) => {
  const f = useCurrentFrame();
  const v = to * tw(f, at, dur);
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{v.toFixed(dec)}{suffix}</span>;
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse 85% 62% at 50% 38%, rgba(201,169,110,0.06), rgba(0,0,0,0) 60%), radial-gradient(ellipse 100% 100% at 50% 50%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.7) 100%)" }} />
);
