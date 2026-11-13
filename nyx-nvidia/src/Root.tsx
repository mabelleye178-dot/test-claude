import React from "react";
import { Composition } from "remotion";
import { Video, TOTAL } from "./Video";
import { VideoV3, V3_TOTAL } from "./v3/VideoV3";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="NyxNvidia" component={Video} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
      <Composition id="NyxNvidiaV3" component={VideoV3} durationInFrames={V3_TOTAL} fps={30} width={1080} height={1920} defaultProps={{ audio: true }} />
    </>
  );
};
