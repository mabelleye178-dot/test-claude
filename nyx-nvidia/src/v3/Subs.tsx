import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F, W } from "../theme";
import { TL, tw } from "./shared";

// Subtitle band sits above the WeChat Channels bottom UI (keep y < 1600) and below scene content (y < 1400).
export const SUB_TOP = 1432;

export const Subs: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / TL.fps;
  const c = TL.cues.find((x) => t >= x.start - 0.05 && t < x.end + 0.18);
  if (!c) return null;
  const a = tw(f, (c.start - 0.05) * TL.fps, 7) * (1 - tw(f, (c.end + 0.02) * TL.fps, 5));
  const parts = c.text.split(/(\d+(?:\.\d+)?%?|CEO|H20)/g);
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: SUB_TOP, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ opacity: a, transform: `translateY(${(1 - a) * 10}px)`, maxWidth: 930, padding: "16px 32px", borderRadius: 14, background: "rgba(6,6,7,0.78)", borderLeft: `3px solid ${C.gold}`, fontFamily: F.sans, fontWeight: 500, fontSize: 43, lineHeight: 1.42, color: C.ink, textAlign: "center", textWrap: "balance", textShadow: "0 2px 12px rgba(0,0,0,0.85)" }}>
        {parts.map((p, i) => (/^(\d|CEO|H20)/.test(p) ? <span key={i} style={{ color: C.goldLight, fontWeight: 700 }}>{p}</span> : <span key={i}>{p}</span>))}
      </div>
    </div>
  );
};
