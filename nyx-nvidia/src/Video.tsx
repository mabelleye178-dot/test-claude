import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import timing from "./timing.json";
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

export const T = timing.transition; // transition frames
const COMPONENTS: Record<string, React.FC> = { hook: Hook, title: Title, ownership: Ownership, board: Board, power: Power, timeline: Timeline, verdict: Verdict, outro: Outro };
// Scene durations come from src/timing.json, written by scripts/audio/build_mix.py from the real narration length.
export const SCENES = timing.scenes.map((s) => ({ id: s.id, d: s.d, C: COMPONENTS[s.id] }));
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
      <Audio src={staticFile("audio/mix.wav")} />
    </AbsoluteFill>
  );
};
