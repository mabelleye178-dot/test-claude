import data from "./timeline.json";

// Single time source for V3: scenes, cues, subtitles and audio all derive from timeline.json.
export const TL = data;
export const FPS = data.fps;
export const TRANS = data.transition;

const sceneStart = (sceneId: string) => data.scenes.find((s) => s.id === sceneId)!.start;

/** Scene-relative frame at which a narration cue starts. */
export const cue = (id: string): number => {
  const c = data.cues.find((x) => x.id === id);
  if (!c) throw new Error("unknown cue " + id);
  return Math.round(c.start * data.fps) - sceneStart(c.scene);
};
/** Scene-relative frame at which a narration cue ends. */
export const cueEnd = (id: string): number => {
  const c = data.cues.find((x) => x.id === id)!;
  return Math.round(c.end * data.fps) - sceneStart(c.scene);
};
export const sceneLen = (sceneId: string) => data.scenes.find((s) => s.id === sceneId)!.d;
