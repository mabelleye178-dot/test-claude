import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { C, F } from "../theme";
import { Atmosphere, Eyebrow, Rise, Tag, TAG_META } from "../components/ui";
import { TIMELINE } from "../data";

// 9 events, 3 pages of 3. Scene length 560 frames: header 0-40, pages at 40/210/380 (170 each).
const PAGE_LEN = 170;
const PAGE0 = 40;
const PER = 3;

export const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const pageIdx = Math.min(2, Math.max(0, Math.floor((frame - PAGE0) / PAGE_LEN)));
  const pageStart = PAGE0 + pageIdx * PAGE_LEN;
  const items = TIMELINE.slice(pageIdx * PER, pageIdx * PER + PER);
  const pageOut = interpolate(frame, [pageStart + PAGE_LEN - 14, pageStart + PAGE_LEN], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineH = interpolate(frame, [pageStart, pageStart + 90], [0, 800], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Atmosphere />
      <div style={{ position: "absolute", top: 190, left: 90, right: 90 }}>
        <Rise from={0}><Eyebrow>Timeline · 新闻时间线</Eyebrow></Rise>
        <Rise from={6}><div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 64, color: C.ink, marginTop: 18 }}>从出口管制到辞任</div></Rise>
        <Rise from={12}>
          <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
            <Tag cls="confirmed" /><Tag cls="media" /><Tag cls="unverified" />
          </div>
        </Rise>
      </div>

      {/* page indicator */}
      <div style={{ position: "absolute", top: 455, left: 90, display: "flex", gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: i === pageIdx ? 44 : 14, height: 6, borderRadius: 3, background: i === pageIdx ? C.gold : C.dim }} />
        ))}
      </div>

      <div style={{ position: "absolute", top: 500, left: 90, right: 90, opacity: pageOut }}>
        <div style={{ position: "absolute", left: 22, top: 10, width: 2, height: lineH, background: `linear-gradient(180deg, ${C.gold}, rgba(201,169,110,0.1))` }} />
        {items.map((it, i) => {
          const from = pageStart + 6 + i * 36;
          const p = interpolate(frame, [from, from + 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
          const color = TAG_META[it.cls].color;
          return (
            <div key={it.date + it.title} style={{ position: "relative", paddingLeft: 70, marginBottom: 34, opacity: p, transform: `translateX(${(1 - p) * 40}px)`, minHeight: 230 }}>
              <div style={{ position: "absolute", left: 12, top: 14, width: 22, height: 22, borderRadius: "50%", background: C.bg, border: `3px solid ${color}`, boxShadow: `0 0 18px ${color}` }} />
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontFamily: F.num, fontWeight: 700, fontSize: 28, color: C.gold, letterSpacing: 2 }}>{it.date}</span>
                <Tag cls={it.cls} style={{ fontSize: 19, padding: "2px 12px" }} />
              </div>
              <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 42, color: it.cls === "unverified" ? C.unverified : C.ink, marginTop: 8, lineHeight: 1.3 }}>{it.title}</div>
              <div style={{ fontFamily: F.sans, fontSize: 26, color: C.muted, marginTop: 8, lineHeight: 1.55 }}>{it.detail}</div>
              <div style={{ fontFamily: F.sans, fontSize: 21, color: C.dim, marginTop: 6 }}>来源：{it.src}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
