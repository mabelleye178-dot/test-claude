import React from "react";
import { Composition } from "remotion";
import { Video, TOTAL } from "./Video";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition id="NyxNvidia" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
  );
};
