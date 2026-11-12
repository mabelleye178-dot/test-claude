import { continueRender, delayRender, staticFile } from "remotion";

type Face = { family: string; weight: string; file: string; unicodeRange: string };

let promise: Promise<void> | null = null;

// Eagerly load every unicode-range subset so no frame is captured with fallback glyphs.
export const loadFonts = (): Promise<void> => {
  if (promise) return promise;
  promise = (async () => {
    const res = await fetch(staticFile("fonts/manifest.json"));
    const faces: Face[] = await res.json();
    await Promise.all(
      faces.map(async (f) => {
        const face = new FontFace(f.family, `url(${staticFile("fonts/" + f.file)})`, {
          weight: f.weight,
          unicodeRange: f.unicodeRange,
          display: "block",
        });
        await face.load();
        document.fonts.add(face);
      }),
    );
  })();
  return promise;
};

export const useFonts = () => {
  const [handle] = React.useState(() => delayRender("Loading CJK fonts", { timeoutInMilliseconds: 120000 }));
  React.useEffect(() => {
    loadFonts().then(() => continueRender(handle));
  }, [handle]);
};

import React from "react";
