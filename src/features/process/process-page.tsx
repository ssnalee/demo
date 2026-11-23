"use client";

import { Button, PageHeader, Panel, Segmented, Stat, StatGroup } from "@/components/ui";
import { downloadCSV } from "@/lib/download";
import { today } from "@/lib/date";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GanttChart, type GanttScale } from "./components/gantt-chart";
import { ProcessTable } from "./components/process-table";
import { processStats, processSummary } from "./lib";
import { useProcesses } from "./store";
import type { Process } from "./types";

export function ProcessPage() {
  const { items = [], error } = useProcesses();
  const router = useRouter();
  const [scale, setScale] = useState<GanttScale>("week");
  const sm = processSummary(items);

  const edit = (x: Process) => router.push(`/process/${encodeURIComponent(x.id)}/edit`);

  return (
    <>
      <PageHeader
        title="공정표"
        description="공종별 공사 기간과 진행률을 막대로 확인합니다. 막대를 누르면 수정할 수 있습니다."
        actions={
          <Button variant="primary" onClick={() => router.push("/process/new")}>
            + 공정 등록
          </Button>
        }
      />
      {error && <p className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-[13px] text-danger">{error}</p>}
      <StatGroup>
        <Stat label="실제 공정률" value={`${sm.overall.toFixed(1)}%`} />
        <Stat label="계획 공정률 (오늘 기준)" value={`${sm.planned.toFixed(1)}%`} />
        <Stat label="진행 중" value={`${sm.active}건`} />
        <Stat label="지연" value={`${sm.delayed}건`} tone={sm.delayed ? "danger" : undefined} icon="alert" />
      </StatGroup>
      {/* 공정이 있을 때만 막대표 표시 */}
      {items.length > 0 && (
        <Panel
          title="공정 막대표"
          actions={
            <div className="no-print flex flex-wrap items-center gap-2">
              <Segmented
                aria-label="막대표 단위"
                value={scale}
                onChange={setScale}
                options={[
                  { value: "day", label: "일" },
                  { value: "week", label: "주" },
                  { value: "month", label: "월" },
                ]}
              />
              <Button size="sm" onClick={() => exportProcessCSV(items)}>
                CSV 내보내기
              </Button>
              <Button size="sm" onClick={() => window.print()}>
                인쇄 / PDF
              </Button>
            </div>
          }
        >
          <GanttChart list={items} scale={scale} onEdit={edit} />
          <div className="mt-2.5 text-[13px] text-sub">
            진행률 기준: 종료일이 지났는데 100%가 아니면 <b className="text-danger">지연</b>, 오늘 기준 계획보다 15% 이상
            늦으면 <b>지연 우려</b>로 표시합니다.
          </div>
        </Panel>
      )}
      <ProcessTable onEdit={edit} />
    </>
  );
}

function exportProcessCSV(list: Process[]) {
  const rows: (string | number)[][] = [
    [
      "공정명",
      "공종",
      "층·구역",
      "담당업체",
      "시작일",
      "종료일",
      "기간(일)",
      "진행률(%)",
      "계획 진행률(%)",
      "상태",
      "선행 공정",
      "메모",
    ],
  ];
  list.forEach((x) => {
    const k = processStats(x);
    rows.push([
      x.title,
      x.trade,
      x.floor,
      x.company,
      x.start,
      x.end,
      k.dur,
      k.p,
      k.planned.toFixed(0),
      k.st,
      x.after,
      x.note,
    ]);
  });
  downloadCSV(rows, `공정표_${today()}.csv`);
}
