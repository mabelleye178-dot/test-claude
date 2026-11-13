import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, W } from "../../theme";
import { Backdrop, Camera, Chapter, Source, Vignette, cue, lerp, tw } from "../shared";

// Names shown only where they appear in SEC filing excerpts; the rest are labelled by role.
const SEATS = [
  { name: "黄仁勋", role: "创始人 · CEO", huang: true },
  { name: "Tench Coxe", role: "独立董事" },
  { name: "Harvey C. Jones", role: "独立董事" },
  { name: "Stephen C. Neal", role: "首席独立董事" },
  { name: "John O. Dabiri", role: "独立董事" },
  { name: "Melissa B. Lora", role: "独立董事" },
  { name: "独立董事", role: "2026年6月当选" },
  { name: "独立董事", role: "2026年6月当选" },
  { name: "独立董事", role: "2026年6月当选" },
  { name: "独立董事", role: "2026年6月当选" },
  { name: "S. Nora Johnson", role: "独立董事 · 7月新增", added: true },
];
const COLS = 3, TW = 290, TH = 150, GAP = 25, LEFT = (W - (COLS * TW + (COLS - 1) * GAP)) / 2, TOP = 640;

// 03 Board authority — seats arrive with the narration; close-up on a single vote.
export const Board: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tE = cue("board.elect"), tX = cue("board.expand"), tO = cue("board.one");
  const count = f < tE ? 0 : f < tX ? Math.min(10, Math.floor((f - tE) / 5) + 1) : 11;
  const one = tw(f, tO, 30);
  return (
    <AbsoluteFill>
      <Backdrop seed="board" />
      <Camera keys={[{ f: 0, s: 1, cx: W / 2, cy: 960 }, { f: tO - 4, s: 1.75, cx: 330, cy: 760, dur: 44 }]}>
        <Chapter en="BOARD AUTHORITY" cn="董事会治理权" opacity={1 - one} />
        <div style={{ position: "absolute", top: 440, left: 80, right: 80, display: "flex", alignItems: "flex-end", gap: 22, opacity: tw(f, tE - 6, 16) * (1 - one) }}>
          <div style={{ fontFamily: F.num, fontWeight: 900, fontSize: 150, lineHeight: 0.95, color: C.gold, minWidth: 180 }}>{count}</div>
          <div style={{ paddingBottom: 14 }}>
            <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 54, color: C.ink }}>席</div>
          </div>
          <div style={{ paddingBottom: 20, marginLeft: 18, fontFamily: F.sans, fontSize: 34, color: C.muted }}>
            {f < tX ? "2026.06 股东大会选出 · 9 位独立" : "2026.07 新增 1 席 · 10 位独立"}
          </div>
        </div>
        {SEATS.map((s, i) => {
          const col = i % COLS, row = Math.floor(i / COLS);
          const at = s.added ? tX + 4 : tE + i * 5;
          const p = spring({ frame: f - at, fps, config: { damping: 16, stiffness: 150 } });
          const ghost = s.added ? 0 : tw(f, 8 + i * 3, 16);
          const dim = s.huang ? 1 : lerp(1, 0.04, one);
          return (
            <div key={i} style={{ position: "absolute", left: LEFT + col * (TW + GAP), top: TOP + row * (TH + GAP), width: TW, height: TH }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 16, border: `2px dashed rgba(201,169,110,0.42)`, opacity: ghost * (1 - Math.min(1, p)) }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 16, boxSizing: "border-box", padding: "22px 22px", border: `${s.huang ? 2.5 : 1.5}px solid ${s.huang ? C.gold : s.added ? C.goldLight : "rgba(201,169,110,0.32)"}`, background: s.huang ? "rgba(201,169,110,0.16)" : "rgba(255,255,255,0.03)", opacity: Math.min(1, p) * dim, transform: `scale(${0.6 + 0.4 * p})`, boxShadow: s.huang ? `0 0 ${40 * one}px rgba(201,169,110,${0.5 * one})` : s.added ? `0 0 ${30 * (1 - tw(f, tX + 30, 40))}px rgba(235,220,182,0.6)` : "none" }}>
                <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: s.huang ? 40 : s.name.length > 13 ? 27 : 30, color: s.huang ? C.gold : C.ink, whiteSpace: "nowrap" }}>{s.name}</div>
                <div style={{ fontFamily: F.sans, fontSize: 24, color: s.huang ? C.goldLight : C.muted, marginTop: 10, whiteSpace: "nowrap" }}>{s.role}</div>
              </div>
            </div>
          );
        })}
        {/* close-up label: one vote */}
        <div style={{ position: "absolute", left: LEFT - 10, top: TOP + TH + 18, width: 540, padding: "6px 10px 14px", background: C.bg, borderRadius: 12, opacity: one, transform: `translateY(${(1 - one) * 20}px)` }}>
          <div style={{ fontFamily: F.num, fontWeight: 900, fontSize: 92, color: C.gold, lineHeight: 1 }}>1<span style={{ fontSize: 44, color: C.muted }}> / 11 票</span></div>
          <div style={{ fontFamily: F.sans, fontSize: 26, color: C.ink, marginTop: 10 }}>董事会一人一票</div>
        </div>
        <Source kind="confirmed" style={{ position: "absolute", top: 1345, left: 80, opacity: tw(f, tE + 20, 20) * (1 - one) }}>DEF 14A · 8-K（2026-06-24）</Source>
      </Camera>
      <Vignette />
    </AbsoluteFill>
  );
};
