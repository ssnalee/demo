"use client";

import { BulkEditBar, useSelection } from "@/components/data";
import { Badge, DataTable, type BadgeTone, Input, Panel, type Column } from "@/components/ui";
import { useCollection } from "@/lib/storage/hooks";
import { useMemo } from "react";
import { ATTENDANCE_BULK_EDIT } from "../config";
import type { Attendance } from "../types";

const tone = (s: string): BadgeTone => (s === "출역" ? "success" : s === "결근" ? "danger" : "warning");

export function AttendanceTable({ date, onDateChange }: { date: string; onDateChange: (d: string) => void }) {
  const { items } = useCollection<Attendance>("attendance");
  const rows = useMemo(() => items.filter((x) => x.date === date), [items, date]);
  const ids = useMemo(() => rows.map((x) => x.id), [rows]);
  const sel = useSelection(ids);

  const columns: Column<Attendance>[] = [
    { key: "name", header: "근로자", cell: (x) => <b>{x.workerName}</b> },
    { key: "company", header: "소속업체", cell: (x) => x.company || "" },
    { key: "where", header: "작업위치·공종", cell: (x) => `${x.floor} · ${x.trade}` },
    {
      key: "time",
      header: "출퇴근",
      cell: (x) => <span className="whitespace-nowrap">{`${x.inTime || "-"} ~ ${x.outTime || "-"}`}</span>,
    },
    { key: "status", header: "상태", cell: (x) => <Badge tone={tone(x.status)}>{x.status}</Badge> },
  ];

  return (
    <Panel
      title={
        <>
          일일 출역 현황 <span className="ml-1 text-sm font-medium text-sub">{rows.length}명</span>
        </>
      }
      actions={
        <Input type="date" compact className="w-[170px]" value={date} onChange={(e) => onDateChange(e.target.value)} aria-label="출역일자" />
      }
    >
      <BulkEditBar config={ATTENDANCE_BULK_EDIT} selected={sel.selected} onClear={sel.clear} />
      <DataTable rows={rows} columns={columns} selection={sel} empty="이 날짜의 출역기록이 없습니다." />
    </Panel>
  );
}
