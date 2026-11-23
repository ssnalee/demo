"use client";

import { Badge, Button, DataTable, Muted, Panel, RowActions, Select, toast, type Column, confirmDelete } from "@/components/ui";
import { downloadCSV } from "@/lib/download";
import { printRecord } from "@/lib/print";
import { useCollection } from "@/lib/storage/hooks";
import { useState } from "react";
import { priorityTone, scheduleRange, sortByStart } from "../lib";
import { SCHEDULE_CATEGORIES, SCHEDULE_STATUSES, type Schedule } from "../types";

export function ScheduleTable({ onEdit }: { onEdit: (x: Schedule) => void }) {
  const { items, remove } = useCollection<Schedule>("schedules");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const rows = sortByStart(
    items.filter((x) => (!cat || x.category === cat) && (!status || x.status === status) && (!priority || x.priority === priority)),
  );

  const columns: Column<Schedule>[] = [
    {
      key: "date",
      header: "일정일·시간",
      cell: (x) => (
        <>
          <b>{scheduleRange(x)}</b>
          <Muted>{x.time || "시간 미정"}</Muted>
        </>
      ),
    },
    {
      key: "title",
      header: "일정·장소",
      cell: (x) => (
        <>
          <b>{x.title}</b>
          <Muted>
            {x.category} · {x.floor || "층 미지정"} {x.location}
          </Muted>
        </>
      ),
    },
    {
      key: "priority",
      header: "중요도·상태",
      cell: (x) => (
        <>
          <Badge tone={priorityTone(x.priority)}>{x.priority}</Badge>
          <div className="mt-1">{x.status}</div>
        </>
      ),
    },
    {
      key: "owner",
      header: "담당자·업체",
      cell: (x) => (
        <>
          {x.owner || "미지정"}
          <br />
          {x.company}
        </>
      ),
    },
    {
      key: "content",
      header: "내용·결과",
      cell: (x) => (
        <>
          {x.content}
          {x.result && <Muted>{x.result}</Muted>}
        </>
      ),
    },
    {
      key: "manage",
      header: "관리",
      cell: (x) => (
        <RowActions
          onEdit={() => onEdit(x)}
          onPrint={() => printSchedule(x)}
          onDelete={async () => {
            if (!(await confirmDelete("이 일정을 삭제합니다. 되돌릴 수 없습니다."))) return;
            remove(x.id);
            toast("일정을 삭제했습니다.");
          }}
        />
      ),
    },
  ];

  return (
    <Panel
      title="일정 목록"
      actions={
        <div className="no-print flex flex-wrap items-center gap-2">
          <Select compact className="w-auto" placeholder="전체 구분" options={[...SCHEDULE_CATEGORIES]} value={cat} onChange={(e) => setCat(e.target.value)} />
          <Select compact className="w-auto" placeholder="전체 상태" options={[...SCHEDULE_STATUSES]} value={status} onChange={(e) => setStatus(e.target.value)} />
          <Select
            compact
            className="w-auto"
            placeholder="전체 중요도"
            options={["긴급", "중요", "일반"]}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
          <Button size="sm" onClick={() => exportSchedulesCSV(items)}>
            CSV 내보내기
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            인쇄 / PDF
          </Button>
        </div>
      }
    >
      <DataTable rows={rows} columns={columns} />
    </Panel>
  );
}

function printSchedule(x: Schedule) {
  printRecord("현장 일정 기록", [
    ["일정명", x.title],
    ["구분", x.category],
    ["시작일", x.start],
    ["종료일", x.end],
    ["시간", `${x.time || ""} ~ ${x.endTime || ""}`],
    ["중요도", x.priority],
    ["진행 상태", x.status],
    ["담당자", x.owner],
    ["담당 업체", x.company],
    ["층·구역", x.floor],
    ["장소", x.location],
    ["상세 내용 및 준비사항", x.content],
    ["완료 확인 및 결과", x.result],
  ]);
}

function exportSchedulesCSV(list: Schedule[]) {
  const rows = [["일정명", "구분", "시작일", "종료일", "시작시간", "종료시간", "중요도", "상태", "담당자", "담당업체", "층·구역", "장소", "상세내용", "완료결과"]];
  list.forEach((x) =>
    rows.push([x.title, x.category, x.start, x.end, x.time, x.endTime, x.priority, x.status, x.owner, x.company, x.floor, x.location, x.content, x.result]),
  );
  downloadCSV(rows, "현장_일정관리.csv");
}
