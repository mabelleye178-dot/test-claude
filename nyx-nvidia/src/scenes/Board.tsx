import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { C, F, W } from "../theme";
import { Atmosphere, Eyebrow, Rise, Tag } from "../components/ui";
import { BOARD } from "../data";

// 11-seat matrix. Phase A (0-180): seats fly in, 10 elected + 1 added.  Phase B (180+): Huang seat vacates.
export const Board: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cols = 3;
  const cardW = 290, cardH = 150, gap = 20;
  const gridW = cols * cardW + (cols - 1) * gap;
  const left = (W - gridW) / 2;
  const top = 500;
  const EXIT = 215;
  const exitP = spring({ frame: frame - EXIT, fps, config: { damping: 30, stiffness: 90 } });
  const count = frame < 120 ? 10 : frame < EXIT ? 11 : 10;
  const countLabel = frame < 120 ? "2026-06-24 股东选出" : frame < EXIT ? "2026-07-13 增至" : "2026-11-12 黄仁勋辞任后";

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Atmosphere />
      <div style={{ position: "absolute", top: 190, left: 90, right: 90 }}>
        <Rise from={0}>
          <Eyebrow>Board · 董事会席位</Eyebrow>
        </Rise>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginTop: 14 }}>
          <Rise from={6}>
            <div style={{ fontFamily: F.num, fontWeight: 900, fontSize: 150, color: C.gold, lineHeight: 1 }}>{count}</div>
          </Rise>
          <Rise from={10}>
            <div style={{ paddingBottom: 18 }}>
              <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 54, color: C.ink }}>席董事会</div>
              <div style={{ fontFamily: F.sans, fontSize: 26, color: C.muted, marginTop: 6 }}>{countLabel}</div>
            </div>
          </Rise>
        </div>
        <Rise from={14}>
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <Tag cls="confirmed" />
            <span style={{ fontFamily: F.sans, fontSize: 24, color: C.muted }}>DEF 14A · 8-K (2026-06-24) · 新闻稿 (2026-11-12)</span>
          </div>
        </Rise>
      </div>

      {BOARD.seats.map((s, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = left + col * (cardW + gap);
        const y = top + row * (cardH + gap);
        const delay = s.isNew ? 120 : 24 + i * 9;
        const p = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 140 } });
        const vac = s.isHuang ? exitP : 0;
        const border = s.isHuang ? C.gold : s.isNew ? C.goldLight : "rgba(201,169,110,0.25)";
        return (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: cardW,
              height: cardH,
              borderRadius: 14,
              border: `1.5px solid ${border}`,
              background: s.isHuang ? `rgba(201,169,110,${0.16 * (1 - vac)})` : "rgba(255,255,255,0.025)",
              opacity: p,
              transform: `scale(${0.7 + 0.3 * p}) rotateY(${vac * 180}deg)`,
              padding: "18px 20px",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <div style={{ opacity: 1 - vac }}>
              <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: s.name.length > 14 ? 24 : 28, color: s.isHuang ? C.gold : C.ink, whiteSpace: "nowrap" }}>{s.name}</div>
              <div style={{ fontFamily: F.sans, fontSize: 21, color: s.independent ? C.muted : C.gold, marginTop: 8 }}>{s.role}</div>
              <div style={{ fontFamily: F.sans, fontSize: 20, color: C.dim, marginTop: 4 }}>{s.since ? `任职 ${s.since}` : ""}</div>
            </div>
            {s.isHuang ? (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: vac, transform: "rotateY(180deg)" }}>
                <div style={{ fontFamily: F.serif, fontWeight: 900, fontSize: 34, color: C.unverified }}>席位空缺</div>
                <div style={{ fontFamily: F.sans, fontSize: 20, color: C.muted, marginTop: 6 }}>2026-11-12 辞任</div>
              </div>
            ) : null}
            {s.isNew ? (
              <div style={{ position: "absolute", top: 10, right: 12, fontFamily: F.sans, fontSize: 18, color: C.goldLight, letterSpacing: 2 }}>+1</div>
            ) : null}
          </div>
        );
      })}

      {/* legend / stat line */}
      <div style={{ position: "absolute", top: 1200, left: 90, right: 90 }}>
        <Rise from={60}>
          <div style={{ display: "flex", gap: 40, fontFamily: F.sans, fontSize: 26, color: C.muted }}>
            <span><span style={{ color: C.gold, fontWeight: 700 }}>1</span> 位内部董事</span>
            <span><span style={{ color: C.ink, fontWeight: 700 }}>{frame < 120 ? 9 : 10}</span> 位独立董事</span>
            <span>任期 <span style={{ color: C.ink, fontWeight: 700 }}>1 年</span> · 每年改选</span>
          </div>
        </Rise>
        <div
          style={{
            marginTop: 26,
            opacity: exitP,
            transform: `translateY(${(1 - exitP) * 20}px)`,
            fontFamily: F.sans,
            fontSize: 28,
            color: C.ink,
            lineHeight: 1.6,
            borderLeft: `3px solid ${C.gold}`,
            paddingLeft: 20,
          }}
        >
          辞任后：<span style={{ color: C.gold, fontWeight: 700 }}>10 席全部独立</span>，Harvey C. Jones 出任公司历史上首位董事长。
          <div style={{ fontSize: 22, color: C.muted, marginTop: 4 }}>部分独立董事姓名据 SEC 文件摘录及第三方代理投票分析整理</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
