"use client";

import { EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DAY_MS, dUTC, today } from "@/lib/date";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { processStats } from "../lib";
import type { Process, ProcessStatus } from "../types";

export type GanttScale = "day" | "week" | "month";

/** 상태별 막대 색 (바탕 = 전체 기간, 채움 = 진행률) */
export const STATUS_STYLE: Record<ProcessStatus, { track: string; fill: string; dot: string }> = {
  예정: { track: "bg-[#eef0f3]", fill: "bg-[#98a2b3]", dot: "bg-[#98a2b3]" },
  "진행 중": { track: "bg-[#e0f2fe]", fill: "bg-brand", dot: "bg-brand" },
  "지연 우려": { track: "bg-[#fef0c7]", fill: "bg-[#f79009]", dot: "bg-[#f79009]" },
  지연: { track: "bg-danger-soft", fill: "bg-danger", dot: "bg-danger" },
  완료: { track: "bg-success-soft", fill: "bg-success", dot: "bg-success" },
};

/** 단위별 최소 하루 너비(px). 화면이 넓으면 꽉 차도록 늘어남 */
const MIN_DAY_W: Record<GanttScale, number> = { day: 34, week: 14, month: 4 };
const LABEL_W = 240;
const HEAD_ROW = 30;

const utc = (ms: number) => new Date(ms);
const startOfWeek = (ms: number) => ms - ((utc(ms).getUTCDay() + 6) % 7) * DAY_MS;
const endOfWeek = (ms: number) => ms + ((7 - utc(ms).getUTCDay()) % 7) * DAY_MS;
const startOfMonth = (ms: number) => Date.UTC(utc(ms).getUTCFullYear(), utc(ms).getUTCMonth(), 1);
const endOfMonth = (ms: number) => Date.UTC(utc(ms).getUTCFullYear(), utc(ms).getUTCMonth() + 1, 0);
const mmdd = (s: string) => s.slice(5).replace("-", "/");

/** 공정 막대표 (막대·이름을 누르면 수정 화면으로) */
export function GanttChart({ list, scale, onEdit }: { list: Process[]; scale: GanttScale; onEdit: (x: Process) => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(0);
  const hasRows = list.length > 0;

  // 화면 너비를 따라 하루 너비를 다시 계산
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el);
    setBoxW(el.clientWidth);
    return () => ro.disconnect();
    // 빈 상태 ↔ 막대표 전환 시 관찰 대상이 바뀜
  }, [hasRows]);

  const a = list
    .filter((x) => x.start && x.end)
    .sort((x, y) => x.start.localeCompare(y.start) || x.end.localeCompare(y.end));

  const todayStr = today();
  const t = dUTC(todayStr);

  // 범위: 모든 공정 + 오늘, 앞뒤 여유를 두고 단위 경계에 맞춤
  const minS = Math.min(t, ...a.map((x) => dUTC(x.start)));
  const maxE = Math.max(t, ...a.map((x) => dUTC(x.end)));
  const pad = scale === "day" ? 3 : scale === "week" ? 7 : 15;
  const s0 = scale === "month" ? startOfMonth(minS - pad * DAY_MS) : startOfWeek(minS - pad * DAY_MS);
  const e0 = scale === "month" ? endOfMonth(maxE + pad * DAY_MS) : endOfWeek(maxE + pad * DAY_MS);
  const days = Math.round((e0 - s0) / DAY_MS) + 1;
  const dw = Math.max(MIN_DAY_W[scale], boxW ? (boxW - LABEL_W - 2) / days : 0);
  const W = Math.round(days * dw);
  const x = (ms: number) => ((ms - s0) / DAY_MS) * dw;
  const todayX = x(t) + dw / 2;

  // 마우스로 잡고 끌어서 양옆으로 이동 (끈 뒤에는 클릭으로 수정 화면이 열리지 않게)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragProps = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return; // 터치는 기본 스크롤 사용
      drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false };
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 4) {
        d.moved = true;
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      if (d.moved) e.currentTarget.scrollLeft = d.left - dx;
    },
    onPointerUp: () => {
      setDragging(false);
      // click 이벤트가 끝난 뒤에 초기화
      setTimeout(() => (drag.current = null));
    },
    onClickCapture: (e: React.MouseEvent) => {
      if (drag.current?.moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };

  // 처음 열 때·단위를 바꿀 때 오늘 근처로 스크롤
  useEffect(() => {
    const g = boxRef.current;
    if (g) g.scrollLeft = Math.max(0, todayX + LABEL_W - g.clientWidth * 0.4);
  }, [scale, todayX]);

  if (!a.length)
    return (
      <div ref={boxRef}>
        <EmptyState>‘+ 새 공정’으로 공정을 등록하면 막대 공정표가 그려집니다.</EmptyState>
      </div>
    );

  // 머리글 위 줄(월 또는 연도) · 아래 줄(일/주/월) · 세로 격자선
  const top: { left: number; width: number; label: string }[] = [];
  const bottom: { left: number; width: number; label: string; weekend?: boolean; today?: boolean }[] = [];
  const lines: number[] = [];
  const weekends: number[] = [];

  if (scale === "month") {
    for (let m = s0; m <= e0; m = endOfMonth(m) + DAY_MS) {
      const d = utc(m);
      const w = x(endOfMonth(m) + DAY_MS) - x(m);
      bottom.push({ left: x(m), width: w, label: `${d.getUTCMonth() + 1}월` });
      lines.push(x(m));
      if (d.getUTCMonth() === 0 || m === s0) top.push({ left: x(m), width: 0, label: `${d.getUTCFullYear()}년` });
    }
  } else {
    for (let i = 0; i < days; i++) {
      const ms = s0 + i * DAY_MS;
      const d = utc(ms);
      const dd = d.getUTCDate();
      if (dd === 1 || i === 0) top.push({ left: x(ms), width: 0, label: `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월` });
      if (scale === "day") {
        const weekend = [0, 6].includes(d.getUTCDay());
        bottom.push({ left: x(ms), width: dw, label: String(dd), weekend, today: ms === t });
        lines.push(x(ms));
        if (weekend) weekends.push(x(ms));
      } else if (d.getUTCDay() === 1) {
        bottom.push({ left: x(ms), width: dw * 7, label: `${d.getUTCMonth() + 1}/${dd}` });
        lines.push(x(ms));
      }
    }
  }
  // 위 줄 구간 너비 = 다음 구간 시작까지
  top.forEach((seg, i) => (seg.width = (top[i + 1]?.left ?? W) - seg.left));

  const grid = (
    <>
      {weekends.map((l) => (
        <div key={`w${l}`} className="absolute inset-y-0 bg-[#f8f9fb]" style={{ left: l, width: dw }} />
      ))}
      {lines.map((l) => (
        <div key={`l${l}`} className="absolute inset-y-0 w-px bg-line-2" style={{ left: l }} />
      ))}
      {/* 오늘: 그날 칸을 옅게 + 가운데 가는 선 */}
      <div className="absolute inset-y-0 bg-brand/[0.06]" style={{ left: x(t), width: Math.max(dw, 2) }} />
      <div className="absolute inset-y-0 z-[1] w-px bg-brand/50" style={{ left: todayX }} />
    </>
  );

  return (
    <>
      <div
        ref={boxRef}
        {...dragProps}
        className={cn(
          // 공정이 많으면 세로 스크롤 (머리글은 위, 공정명은 왼쪽에 고정)
          "mt-1 max-h-[560px] overflow-auto overscroll-contain rounded-xl border border-line bg-white select-none print:max-h-none print:overflow-visible",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        <div className="min-w-max">
          {/* 머리글 */}
          <div className="sticky top-0 z-[4] flex border-b border-line bg-white">
            <Label className="flex items-end pb-2 text-[12px] font-medium text-sub">공정 {a.length}건</Label>
            <div className="relative flex-none" style={{ width: W, height: HEAD_ROW * 2 }}>
              {top.map((seg) => (
                <div
                  key={`t${seg.left}`}
                  className="absolute top-0 border-l border-line-2 text-[12px] leading-[30px] font-semibold text-fg"
                  style={{ left: seg.left, width: seg.width, height: HEAD_ROW }}
                >
                  {/* 가로로 스크롤해도 구간 안에서 왼쪽에 붙어 따라옴 */}
                  <span className="sticky inline-block truncate px-2" style={{ left: LABEL_W, maxWidth: seg.width }}>
                    {seg.label}
                  </span>
                </div>
              ))}
              {bottom.map((seg) => (
                <div
                  key={`b${seg.left}`}
                  className={cn(
                    "absolute truncate border-l border-line-2 text-[11.5px] leading-[30px] text-sub",
                    scale === "day" ? "text-center" : "px-2",
                    seg.weekend && "bg-[#f8f9fb] text-[#98a2b3]",
                  )}
                  style={{ top: HEAD_ROW, left: seg.left, width: seg.width, height: HEAD_ROW }}
                >
                  {seg.today ? (
                    <span className="inline-grid size-[22px] place-items-center rounded-full bg-brand text-[11px] leading-none font-semibold text-white">
                      {seg.label}
                    </span>
                  ) : (
                    seg.label
                  )}
                </div>
              ))}
              {/* 주·월 단위: 오늘 위치에 작은 점 */}
              {scale !== "day" && (
                <span
                  title="오늘"
                  className="absolute bottom-0 z-[2] size-[7px] -translate-x-1/2 translate-y-1/2 rounded-full bg-brand ring-2 ring-white"
                  style={{ left: todayX }}
                />
              )}
            </div>
          </div>

          {/* 공정 행 */}
          {a.map((p) => {
            const k = processStats(p, todayStr);
            const st = STATUS_STYLE[k.st];
            const left = x(dUTC(p.start));
            const width = Math.max(dw, k.dur * dw);
            const meta = [p.company, `${mmdd(p.start)}~${mmdd(p.end)}`].filter(Boolean).join(" · ");
            return (
              <div key={p.id} className="group flex border-b border-line-2 last:border-b-0">
                <Label className="cursor-pointer py-2.5 group-hover:bg-[#f9fafb]" onClick={() => onEdit(p)}>
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 flex-none rounded-full", st.dot)} title={k.st} />
                    <b className="truncate text-[13px] font-semibold">{p.title}</b>
                  </div>
                  <div className="mt-0.5 truncate pl-4 text-[11.5px] text-sub">{meta}</div>
                </Label>
                <div className="relative h-[54px] flex-none group-hover:bg-[#fcfcfd]" style={{ width: W }}>
                  {grid}
                  <button
                    type="button"
                    className={cn("absolute top-1/2 z-[2] h-[22px] -translate-y-1/2 cursor-pointer overflow-hidden rounded-md", st.track)}
                    style={{ left, width }}
                    title={`${p.title} · ${p.start} ~ ${p.end} (${k.dur}일) · ${k.st} · ${k.p}%`}
                    onClick={() => onEdit(p)}
                  >
                    <span className={cn("block h-full", st.fill)} style={{ width: `${k.p}%` }} />
                  </button>
                  <span
                    className="pointer-events-none absolute top-1/2 z-[2] ml-2 -translate-y-1/2 text-[12px] font-semibold whitespace-nowrap text-fg-2"
                    style={{ left: left + width }}
                  >
                    {k.p}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 범례 */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-sub">
        {(Object.keys(STATUS_STYLE) as ProcessStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2 w-3.5 rounded-sm", STATUS_STYLE[s].fill)} />
            {s}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-px bg-brand/50" />
          오늘
        </span>
      </div>
    </>
  );
}

/** 왼쪽 고정 칸 (가로 스크롤해도 고정) */
function Label({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div
      className={cn("sticky left-0 z-[3] flex flex-none flex-col justify-center border-r border-line bg-white px-4", className)}
      style={{ width: LABEL_W }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
