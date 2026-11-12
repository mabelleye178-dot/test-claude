import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Hook } from "./scenes/Hook";
import { Title } from "./scenes/Title";
import { Ownership } from "./scenes/Ownership";
import { Board } from "./scenes/Board";
import { Power } from "./scenes/Power";
import { Timeline } from "./scenes/Timeline";
import { Verdict } from "./scenes/Verdict";
import { Outro } from "./scenes/Outro";
import { BrandBar } from "./components/Brand";
import { Subtitles } from "./components/Subtitles";
import { useFonts } from "./fonts";
import { C } from "./theme";

export const T = 20; // transition frames
// Scene durations (frames). Sum - 7*T = 2250.
export const SCENES = [
  { id: "hook", d: 190, C: Hook },
  { id: "title", d: 220, C: Title },
  { id: "ownership", d: 370, C: Ownership },
  { id: "board", d: 320, C: Board },
  { id: "power", d: 330, C: Power },
  { id: "timeline", d: 560, C: Timeline },
  { id: "verdict", d: 230, C: Verdict },
  { id: "outro", d: 170, C: Outro },
];
export const TOTAL = SCENES.reduce((a, s) => a + s.d, 0) - (SCENES.length - 1) * T;

export const Video: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <TransitionSeries>
        {SCENES.map((s, i) => (
          <React.Fragment key={s.id}>
            <TransitionSeries.Sequence durationInFrames={s.d}>
              <s.C />
            </TransitionSeries.Sequence>
            {i < SCENES.length - 1 ? (
              <TransitionSeries.Transition
                presentation={i % 2 === 0 ? fade() : slide({ direction: "from-bottom" })}
                timing={linearTiming({ durationInFrames: T })}
              />
            ) : null}
          </React.Fragment>
        ))}
      </TransitionSeries>
      <BrandBar />
      <Subtitles />
    </AbsoluteFill>
  );
};
