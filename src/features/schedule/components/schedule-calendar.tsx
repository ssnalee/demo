"use client";

import { Button, Panel } from "@/components/ui";
import { cn } from "@/lib/cn";
import { today } from "@/lib/date";
import { useState } from "react";
import { scheduleOn } from "../lib";
import type { Schedule } from "../types";

const HEADS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");
const thisMonth = () => {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() };
};

/** 월간 일정표 */
export function ScheduleCalendar({ items }: { items: Schedule[] }) {
  const [{ y, m }, setMonth] = useState(thisMonth);
  const change = (n: number) => {
    const d = new Date(y, m + n, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
  };
  const startOffset = new Date(y, m, 1).getDay();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const total = Math.ceil((startOffset + lastDay) / 7) * 7;
  const todayStr = today();

  return (
    <Panel
      title="월간 일정표"
      actions={
        <div className="no-print flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => change(-1)}>
            이전 달
          </Button>
          <strong className="text-sm">
            {y}년 {m + 1}월
          </strong>
          <Button size="sm" onClick={() => change(1)}>
            다음 달
          </Button>
          <Button size="sm" onClick={() => setMonth(thisMonth())}>
            이번 달
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-1">
        {HEADS.map((h) => (
          <div key={h} className="p-1.5 text-center text-xs font-medium text-sub">
            {h}
          </div>
        ))}
        {Array.from({ length: total }, (_, n) => {
          const day = n - startOffset + 1;
          const valid = day > 0 && day <= lastDay;
          const date = valid ? `${y}-${pad(m + 1)}-${pad(day)}` : "";
          const list = valid ? items.filter((x) => scheduleOn(x, date)) : [];
          return (
            <div
              key={n}
              className={cn(
                "min-h-[86px] min-w-0 rounded-[10px] border p-1 sm:p-2",
                valid ? "bg-white" : "bg-[#f9fafb]",
                valid && date === todayStr ? "border-fg" : "border-line-2",
              )}
            >
              <div className={cn("text-xs font-bold", valid ? "text-fg" : "text-[#98a2b3]")}>{valid ? day : ""}</div>
              {list.slice(0, 3).map((x) => (
                <div
                  key={x.id}
                  title={x.title}
                  className={cn(
                    "mt-1 rounded p-[3px] text-[10px] leading-[1.35] [overflow-wrap:anywhere]",
                    x.priority === "긴급" ? "bg-danger-soft" : x.priority === "중요" ? "bg-warning-soft" : "bg-fill",
                  )}
                >
                  {x.title}
                </div>
              ))}
              {list.length > 3 && <div className="mt-1 text-[11px] text-sub">+{list.length - 3}건</div>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
