import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F, W } from "../../theme";
import { Backdrop, Camera, Count, E, Source, Vignette, cue, lerp, tw } from "../shared";

// 01 The Hook — one number, then the event, then the question.
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const who = cue("hook.who"), ev = cue("hook.event"), q = cue("hook.q");
  const up = tw(f, ev - 6, 30, 0, 1, E.inOut); // number moves up when the event arrives
  const numY = lerp(660, 330, up), numS = lerp(1, 0.56, up);
  const shimmer = (f * 7) % 1600;
  const lineW = tw(f, 26, 40) * 430;
  const ring = tw(f, 0, 70), ringA = tw(f, 0, 12) * (1 - tw(f, 30, 50));
  const whoA = tw(f, who, 18) * (1 - up);
  const evA = tw(f, ev, 20), qA = tw(f, q, 22);
  const evDim = lerp(1, 0.45, tw(f, q, 20));
  return (
    <AbsoluteFill>
      <Backdrop seed="hook" />
      <Camera keys={[{ f: 0, s: 1.0, cx: W / 2, cy: 960 }]} drift={0.00022}>
        {/* depth lines */}
        <div style={{ position: "absolute", left: W / 2 - 430, top: numY + 190 * numS + 40, width: 860, height: 1, opacity: 0.0 }} />
        <div style={{ position: "absolute", left: W / 2 - 420, top: 260, width: 840, height: 840, borderRadius: "50%", border: `1.5px solid ${C.gold}`, opacity: ringA * 0.7, transform: `scale(${0.3 + ring * 1.3})` }} />
        <div style={{ position: "absolute", top: numY, width: W, textAlign: "center", transform: `scale(${numS * lerp(1.12, 1, tw(f, 0, 46))})`, opacity: tw(f, 0, 10) }}>
          <div style={{ fontFamily: F.num, fontWeight: 900, fontSize: 292, lineHeight: 1, letterSpacing: -12, backgroundImage: `linear-gradient(100deg, ${C.goldDark} 0%, ${C.gold} 35%, ${C.goldLight} 50%, ${C.gold} 65%, ${C.goldDark} 100%)`, backgroundSize: "1600px 100%", backgroundPosition: `${shimmer - 800}px 0`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            <Count to={3.58} at={3} dur={34} dec={2} suffix="%" />
          </div>
        </div>
        {/* hairlines growing from centre */}
        <div style={{ position: "absolute", top: lerp(1010, 545, up), left: W / 2 - lineW, width: lineW * 2, height: 2, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, opacity: 1 - up * 0.4 }} />
        <div style={{ position: "absolute", top: 1060, width: W, textAlign: "center", opacity: whoA, transform: `translateY(${(1 - tw(f, who, 18)) * 26}px)` }}>
          <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 62, color: C.ink, letterSpacing: 4 }}>黄仁勋 · 英伟达持股</div>
          <div style={{ fontFamily: F.sans, fontSize: 28, color: C.muted, marginTop: 18, letterSpacing: 3 }}>截至 2026-03-23 · 股东委托书</div>
        </div>
        {/* the event */}
        <div style={{ position: "absolute", top: 640, left: 80, right: 80, opacity: evA * evDim, transform: `translateY(${(1 - evA) * 40}px)` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 26 }}>
            <span style={{ fontFamily: F.num, fontWeight: 900, fontSize: 96, color: C.gold, letterSpacing: -2 }}>2026.11</span>
            <span style={{ fontFamily: F.sans, fontSize: 30, color: C.muted, letterSpacing: 4 }}>事件</span>
          </div>
          <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 70, color: C.ink, marginTop: 8, lineHeight: 1.25 }}>辞去 CEO 与董事职务</div>
          <Source kind="confirmed" style={{ marginTop: 22 }}>NVIDIA 8-K · 新闻稿</Source>
        </div>
        {/* the question */}
        <div style={{ position: "absolute", top: 985, left: 80, right: 80, opacity: qA, transform: `translateY(${(1 - qA) * 36}px)` }}>
          <div style={{ width: 96 * qA, height: 2, background: C.gold, marginBottom: 30 }} />
          <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 84, color: C.ink, lineHeight: 1.28 }}>
            少数股权的创始人，<br />控制力<span style={{ color: C.gold }}>从哪里来？</span>
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 29, color: C.gold, letterSpacing: 5, marginTop: 34, opacity: tw(f, q + 18, 20) }}>黄仁勋的 3.58%：谁真正控制英伟达</div>
        </div>
      </Camera>
      <Vignette />
    </AbsoluteFill>
  );
};
