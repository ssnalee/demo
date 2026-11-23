"use client";

import { Badge, Button, CountPill, DataTable, Muted, Panel, type Column } from "@/components/ui";
import { priorityTone, scheduleRange, scheduleSummary, type Schedule } from "@/features/schedule";
import { useList } from "@/lib/storage/hooks";
import Link from "next/link";

const columns: Column<Schedule>[] = [
  { key: "date", header: "일정일", cell: (x) => scheduleRange(x) },
  {
    key: "title",
    header: "일정명·구분",
    cell: (x) => (
      <>
        <b>{x.title}</b>
        <Muted>{[x.category, x.floor].filter(Boolean).join(" · ")}</Muted>
      </>
    ),
  },
  { key: "priority", header: "중요도", cell: (x) => <Badge tone={priorityTone(x.priority)}>{x.priority}</Badge> },
  { key: "status", header: "상태", cell: (x) => x.status },
];

export function ScheduleOverview() {
  const s = scheduleSummary(useList<Schedule>("schedules"));
  return (
    <Panel
      title="일정 및 중요일정"
      icon="calendar"
      className="mt-0"
      actions={
        <Link href="/schedule">
          <Button variant="link" className="text-brand decoration-transparent">전체 보기 →</Button>
        </Link>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <CountPill label="오늘 일정" count={s.today.length} />
        <CountPill label="3일 이내 중요" count={s.urgent.length} tone="danger" />
        <CountPill label="기한 초과" count={s.overdue.length} tone="danger" />
        <CountPill label="미완료" count={s.open.length} />
      </div>
      <DataTable rows={s.upcoming} columns={columns} compactEmpty empty="다가오는 일정이 없습니다." />
    </Panel>
  );
}
