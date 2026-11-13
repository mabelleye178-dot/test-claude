import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { BrandBar } from "../components/Brand";
import { useFonts } from "../fonts";
import { C } from "../theme";
import { TL } from "./tl";
import { Subs } from "./Subs";
import { Hook } from "./scenes/Hook";
import { Ownership } from "./scenes/Ownership";
import { Board } from "./scenes/Board";
import { Power } from "./scenes/Power";
import { Timeline } from "./scenes/Timeline";
import { Turning } from "./scenes/Turning";
import { Insight } from "./scenes/Insight";
import { Conclusion } from "./scenes/Conclusion";

const COMP: Record<string, React.FC> = { hook: Hook, ownership: Ownership, board: Board, power: Power, timeline: Timeline, turning: Turning, insight: Insight, conclusion: Conclusion };
const SLIDE_AFTER = new Set(["ownership", "power"]);
export const V3_TOTAL = TL.totalFrames;

export const VideoV3: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <TransitionSeries>
        {TL.scenes.map((s, i) => {
          const S = COMP[s.id];
          return (
            <React.Fragment key={s.id}>
              <TransitionSeries.Sequence durationInFrames={s.d}><S /></TransitionSeries.Sequence>
              {i < TL.scenes.length - 1 ? (
                <TransitionSeries.Transition presentation={SLIDE_AFTER.has(s.id) ? slide({ direction: "from-bottom" }) : fade()} timing={linearTiming({ durationInFrames: TL.transition })} />
              ) : null}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      <BrandBar />
      <Subs />
      {audio ? <Audio src={staticFile("audio/v3-mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
