import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { C, F, W } from "../theme";
import { Atmosphere, Eyebrow, Rise, Tag } from "../components/ui";

const Tier: React.FC<{ y: number; from: number; title: string; sub: string; accent?: boolean; right?: React.ReactNode }> = ({ y, from, title, sub, accent, right }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - from, fps, config: { damping: 22, stiffness: 120 } });
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 90,
        width: W - 180,
        height: 190,
        borderRadius: 18,
        border: `1.5px solid ${accent ? C.gold : "rgba(201,169,110,0.3)"}`,
        background: accent ? "rgba(201,169,110,0.10)" : "rgba(255,255,255,0.03)",
        opacity: p,
        transform: `translateY(${(1 - p) * 30}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 54, color: accent ? C.gold : C.ink }}>{title}</div>
        <div style={{ fontFamily: F.sans, fontSize: 26, color: C.muted, marginTop: 6 }}>{sub}</div>
      </div>
      <div>{right}</div>
    </div>
  );
};

// Animated vertical arrow with flowing dashes between tiers
const Flow: React.FC<{ y1: number; y2: number; from: number; label: string; x?: number }> = ({ y1, y2, from, label, x = W / 2 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const len = (y2 - y1) * p;
  return (
    <>
      <svg width={W} height={1920} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
        <line x1={x} y1={y1} x2={x} y2={y1 + len} stroke={C.gold} strokeWidth={3} strokeDasharray="14 12" strokeDashoffset={-frame * 1.5} opacity={0.9} />
        {p > 0.95 ? <polygon points={`${x - 12},${y2 - 18} ${x + 12},${y2 - 18} ${x},${y2}`} fill={C.gold} /> : null}
      </svg>
      <div
        style={{
          position: "absolute",
          top: (y1 + y2) / 2 - 24,
          left: x + 30,
          fontFamily: F.sans,
          fontSize: 26,
          color: C.goldLight,
          opacity: p,
          letterSpacing: 2,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </>
  );
};

export const Power: React.FC = () => {
  const frame = useCurrentFrame();
  const strike = interpolate(frame, [200, 230], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Atmosphere />
      <div style={{ position: "absolute", top: 190, left: 90, right: 90 }}>
        <Rise from={0}><Eyebrow>Power Structure · 权力结构</Eyebrow></Rise>
        <Rise from={6}><div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 64, color: C.ink, marginTop: 18 }}>权力从哪里来？</div></Rise>
        <Rise from={12}>
          <div style={{ display: "flex", gap: 14, marginTop: 14, alignItems: "center" }}>
            <Tag cls="confirmed" />
            <span style={{ fontFamily: F.sans, fontSize: 24, color: C.muted }}>公司章程 · DEF 14A · 8-K (2026-06-24)</span>
          </div>
        </Rise>
      </div>

      <Tier y={470} from={20} title="股东" sub="先锋领航 · 贝莱德 · 公众 · 黄仁勋 3.58%" right={<div style={{ fontFamily: F.num, fontWeight: 900, fontSize: 60, color: C.ink }}>100%</div>} />
      <Flow y1={660} y2={770} from={50} label="每年投票 · 选举全部董事" />
      <Tier y={770} from={70} title="董事会" sub="11 席 · 10 位独立 · 一年任期（2026.07–11）" right={<div style={{ fontFamily: F.num, fontWeight: 900, fontSize: 60, color: C.ink }}>11</div>} />
      <Flow y1={960} y2={1070} from={100} label="任命 · 监督 · 罢免 CEO" />
      <Tier y={1070} from={120} title="CEO" sub="受董事会委任 · 无超级投票权" accent right={<div style={{ fontFamily: F.num, fontWeight: 900, fontSize: 60, color: C.gold }}>3.58%</div>} />

      <div style={{ position: "absolute", top: 1300, left: 90, right: 90 }}>
        <Rise from={150}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {["单一类别普通股", "无双层股权", "无创始人超级投票权", "董事每年改选"].map((t, i) => (
              <span key={i} style={{ fontFamily: F.sans, fontSize: 24, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 999, padding: "8px 20px" }}>{t}</span>
            ))}
          </div>
        </Rise>
        <Rise from={190}>
          <div style={{ marginTop: 26, fontFamily: F.sans, fontSize: 28, color: C.ink, lineHeight: 1.6 }}>
            2026-06-24 股东大会：
            <span style={{ position: "relative", color: C.muted, margin: "0 6px" }}>
              绝对多数条款
              <span style={{ position: "absolute", left: 0, top: "55%", height: 3, width: `${strike * 100}%`, background: C.unverified }} />
            </span>
            → <span style={{ color: C.gold, fontWeight: 700 }}>简单多数</span>
            <span style={{ fontSize: 22, color: C.muted, marginLeft: 12 }}>股东批准 · 门槛降低</span>
          </div>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};
