import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F, W } from "../../theme";
import { Backdrop, Camera, E, Source, Vignette, cue, lerp, tw } from "../shared";

// 06 Turning point — the officially confirmed change. A held beat, then the roles re-arrange.
export const Turning: React.FC = () => {
  const f = useCurrentFrame();
  const tR = cue("turn.resign"), tK = cue("turn.kress"), tC = cue("turn.chair");
  const dateIn = tw(f, tR - 14, 26);
  const roll = tw(f, tK - 4, 20, 0, 1, E.inOut);
  const strike = tw(f, tR + 34, 20, 0, 1, E.inOut);
  const swap = tw(f, tK + 6, 22, 0, 1, E.inOut);
  const chair = tw(f, tC, 24);
  const seats = tw(f, tC + 30, 26, 0, 1, E.inOut);
  return (
    <AbsoluteFill>
      <Backdrop seed="turn" grid={false} />
      <AbsoluteFill style={{ background: "#000", opacity: 1 - tw(f, tR - 20, 24) * 0.55 }} />
      <Camera keys={[{ f: 0, s: 1.1, cx: W / 2, cy: 900 }, { f: tR - 14, s: 1, cx: W / 2, cy: 960, dur: 70 }]}>
        <div style={{ position: "absolute", top: 230, left: 80, fontFamily: F.sans, fontWeight: 700, fontSize: 25, letterSpacing: 7, color: C.gold, opacity: dateIn }}>TURNING POINT · 关键转折</div>
        <div style={{ position: "absolute", top: 300, left: 80, height: 250, overflow: "hidden", opacity: dateIn }}>
          <div style={{ transform: `translateY(${-roll * 250}px)` }}>
            {["11.11", "11.12"].map((d) => (
              <div key={d} style={{ height: 250, fontFamily: F.num, fontWeight: 900, fontSize: 230, lineHeight: "250px", color: C.gold, letterSpacing: -8 }}>{d}</div>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", top: 330, right: 80, textAlign: "right", opacity: dateIn }}>
          <div style={{ fontFamily: F.num, fontWeight: 700, fontSize: 44, color: C.muted }}>2026</div>
          <div style={{ fontFamily: F.sans, fontSize: 30, color: C.ink, marginTop: 110 }}>{roll < 0.5 ? "董事会接受辞任" : "公司正式公告"}</div>
        </div>
        {/* CEO seat */}
        <div style={{ position: "absolute", top: 640, left: 80, right: 80, height: 250, borderRadius: 22, border: `2px solid ${C.gold}`, background: "rgba(201,169,110,0.09)", boxSizing: "border-box", padding: "34px 44px", opacity: tw(f, tR + 6, 22), transform: `translateY(${(1 - tw(f, tR + 6, 22)) * 30}px)` }}>
          <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: C.gold }}>CEO</div>
          <div style={{ position: "relative", height: 150, marginTop: 6 }}>
            <div style={{ position: "absolute", left: 0, top: 0, opacity: 1 - swap, transform: `translateY(${-swap * 30}px)` }}>
              <span style={{ position: "relative", fontFamily: F.serif, fontWeight: 900, fontSize: 92, color: lerp(1, 0.5, strike) > 0.75 ? C.ink : C.muted }}>
                黄仁勋
                <span style={{ position: "absolute", left: -8, top: "54%", height: 5, width: `${strike * 106}%`, background: C.unverified }} />
              </span>
              <span style={{ fontFamily: F.sans, fontSize: 30, color: C.muted, marginLeft: 26, opacity: strike }}>辞去总裁 · CEO · 董事</span>
            </div>
            <div style={{ position: "absolute", left: 0, top: 0, opacity: swap, transform: `translateY(${(1 - swap) * 30}px)` }}>
              <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 84, color: C.ink, lineHeight: 1.1 }}>Colette Kress</div>
              <div style={{ fontFamily: F.sans, fontSize: 32, color: C.goldLight, marginTop: 8 }}>临时 CEO · 继续兼任首席财务官</div>
            </div>
          </div>
        </div>
        {/* Chair */}
        <div style={{ position: "absolute", top: 930, left: 80, right: 80, height: 220, borderRadius: 22, border: `1.5px solid ${C.line}`, background: "rgba(255,255,255,0.03)", boxSizing: "border-box", padding: "30px 44px", opacity: chair, transform: `translateY(${(1 - chair) * 40}px)` }}>
          <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: C.gold }}>董事长 · 公司史上首位</div>
          <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 80, color: C.ink, marginTop: 8 }}>Harvey C. Jones</div>
        </div>
        {/* seats re-arrange 11 -> 10 */}
        <div style={{ position: "absolute", top: 1200, left: 80, right: 80, opacity: tw(f, tC + 16, 20) }}>
          <div style={{ position: "relative", height: 44 }}>
            {new Array(11).fill(0).map((_, i) => {
              const x0 = i * 56, x1 = i === 0 ? 0 : (i - 1) * 56;
              return <div key={i} style={{ position: "absolute", left: lerp(x0, x1, seats), top: 0, width: 40, height: 40, borderRadius: "50%", border: `2px solid ${i === 0 ? C.gold : C.muted}`, background: i === 0 ? C.gold : "transparent", opacity: i === 0 ? 1 - seats : 1 }} />;
            })}
            <div style={{ position: "absolute", left: 640, top: -6, fontFamily: F.sans, fontSize: 34, color: C.ink, whiteSpace: "nowrap" }}>在任董事 <span style={{ fontFamily: F.num, fontWeight: 900, color: C.gold }}>{seats > 0.5 ? 10 : 11}</span> 人</div>
          </div>
        </div>
        <Source kind="confirmed" style={{ position: "absolute", top: 1300, left: 80, opacity: tw(f, tR + 30, 20) }}>NVIDIA 8-K（事件日 11-11）· 新闻稿（11-12）</Source>
      </Camera>
      <Vignette />
    </AbsoluteFill>
  );
};
