import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F, W } from "../../theme";
import { Backdrop, Chapter, E, Pill, PillKind, Vignette, cue, lerp, pillColor, tw } from "../shared";

type Ev = { cue: string; date: string; title: string; detail: string; kind: PillKind; src: string };
const EVENTS: Ev[] = [
  { cue: "tl.bg", date: "2025", title: "H20 出口：先受限，后放行", detail: "4月需出口许可；7月获准恢复对华销售", kind: "confirmed", src: "NVIDIA 公开披露" },
  { cue: "tl.oct", date: "2026.10.29", title: "客户被调查的报道", detail: "报道称美方调查英伟达客户 Megaspeed；黄仁勋称往来属正常业务", kind: "media", src: "Bloomberg" },
  { cue: "tl.nov", date: "2026.11 初", title: "私人关系被报道", detail: "报道指向黄仁勋与该客户一名高管的私人关系", kind: "media", src: "多家媒体" },
  { cue: "tl.alleg", date: "指控", title: "“情报背景”说法", detail: "无公开证据 · 当事公司否认不当行为", kind: "unverified", src: "媒体援引匿名情报来源" },
  { cue: "tl.nov8", date: "2026.11.08", title: "道歉信 · 独立调查", detail: "黄仁勋致员工信道歉；董事会由独立董事牵头调查", kind: "confirmed", src: "NVIDIA 新闻稿" },
];
const STEP = 318, VIEW_TOP = 500, VIEW_H = 880, FOCUS_Y = 300;

// 05 Timeline — one continuous track; the camera follows the narration from event to event.
export const Timeline: React.FC = () => {
  const f = useCurrentFrame();
  const at = EVENTS.map((e) => cue(e.cue));
  // camera position along the track
  let pos = 0;
  for (let i = 1; i < EVENTS.length; i++) pos = lerp(pos, i, tw(f, at[i] - 8, 36, 0, 1, E.inOut));
  const scroll = FOCUS_Y - pos * STEP;
  return (
    <AbsoluteFill>
      <Backdrop seed="timeline" />
      <Chapter en="TIMELINE" cn="事件如何演变" />
      <div style={{ position: "absolute", top: 410, left: 80, display: "flex", gap: 12, opacity: tw(f, 10, 18) }}>
        <Pill kind="confirmed" size={21} /><Pill kind="media" size={21} /><Pill kind="unverified" size={21} />
      </div>
      <div style={{ position: "absolute", top: VIEW_TOP, left: 0, width: W, height: VIEW_H, overflow: "hidden", maskImage: "linear-gradient(180deg, transparent 0%, #000 12%, #000 86%, transparent 100%)", WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 12%, #000 86%, transparent 100%)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: W, transform: `translateY(${scroll}px)` }}>
          <div style={{ position: "absolute", left: 118, top: 30, width: 3, height: pos * STEP + 40 + tw(f, at[0], 30) * 60, background: `linear-gradient(180deg, rgba(201,169,110,0.15), ${C.gold})` }} />
          {EVENTS.map((e, i) => {
            const p = tw(f, at[i], 24);
            const active = 1 - Math.min(1, Math.abs(pos - i));
            const col = pillColor(e.kind);
            return (
              <div key={e.cue} style={{ position: "absolute", top: i * STEP, left: 80, right: 80, paddingLeft: 92, opacity: p * lerp(0.3, 1, active), transform: `translateX(${(1 - p) * 50}px) scale(${lerp(0.96, 1, active)})`, transformOrigin: "0 30px" }}>
                <div style={{ position: "absolute", left: 24, top: 16, width: 30, height: 30, borderRadius: "50%", background: C.bg, border: `4px solid ${col}`, boxShadow: `0 0 ${22 * active}px ${col}` }} />
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <span style={{ fontFamily: F.num, fontWeight: 900, fontSize: 40, color: e.kind === "unverified" ? C.unverified : C.gold, letterSpacing: 1 }}>{e.date}</span>
                  <Pill kind={e.kind} size={21} />
                </div>
                <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 56, color: e.kind === "unverified" ? C.unverified : C.ink, marginTop: 10, lineHeight: 1.22 }}>{e.title}</div>
                <div style={{ fontFamily: F.sans, fontSize: 30, color: C.muted, marginTop: 10, lineHeight: 1.45 }}>{e.detail}</div>
                <div style={{ fontFamily: F.sans, fontSize: 23, color: "#5d584e", marginTop: 6 }}>来源：{e.src}</div>
              </div>
            );
          })}
        </div>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};
