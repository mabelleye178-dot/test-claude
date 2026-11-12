import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import cues from "../subtitles.json";
import { C, F, W, SUBTITLE_TOP } from "../theme";

type Cue = { start: number; end: number; text: string };

export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cue = (cues as Cue[]).find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  const inF = cue.start * fps;
  const outF = cue.end * fps;
  const a = interpolate(frame, [inF, inF + 8, outF - 6, outF], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const dy = interpolate(frame, [inF, inF + 10], [14, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: W,
        top: SUBTITLE_TOP,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity: a,
          transform: `translateY(${dy}px)`,
          maxWidth: 900,
          padding: "18px 34px",
          borderRadius: 14,
          background: "rgba(6,6,7,0.72)",
          backdropFilter: "blur(6px)",
          borderLeft: `3px solid ${C.gold}`,
          fontFamily: F.sans,
          fontWeight: 500,
          fontSize: 40,
          lineHeight: 1.45,
          color: C.ink,
          textAlign: "center",
          textShadow: "0 2px 12px rgba(0,0,0,0.8)",
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};
