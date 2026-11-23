"use client";

import { Button, Notice, PageHeader, Stat, StatGroup, scrollToId } from "@/components/ui";
import { useCollection } from "@/lib/storage/hooks";
import { useState } from "react";
import { ScheduleCalendar } from "./components/schedule-calendar";
import { SCHEDULE_FORM_ID, ScheduleForm } from "./components/schedule-form";
import { ScheduleTable } from "./components/schedule-table";
import { scheduleSummary } from "./lib";
import type { Schedule } from "./types";

export function SchedulePage() {
  const { items } = useCollection<Schedule>("schedules");
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [formKey, setFormKey] = useState(0);
  const sm = scheduleSummary(items);

  return (
    <>
      <PageHeader
        title="일정관리 및 중요일정"
        description="공사일정·안전관리·행정업무·점검·회의·자재반입 등 현장 전체 일정을 관리합니다."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormKey((k) => k + 1);
              scrollToId(SCHEDULE_FORM_ID);
            }}
          >
            새 일정 등록
          </Button>
        }
      />
      <Notice>
        중요도와 일정 기한을 기준으로 대시보드 및 프로그램 실행 시 알림을 표시합니다. 프로그램이 종료된 상태에서는 실시간 알림이
        발생하지 않습니다.
      </Notice>
      <StatGroup>
        <Stat label="오늘 일정" value={`${sm.today.length}건`} />
        <Stat label="중요 일정" value={`${sm.important.length}건`} />
        <Stat label="기한 초과" value={`${sm.overdue.length}건`} tone={sm.overdue.length ? "danger" : undefined} icon="alert" />
        <Stat label="완료" value={`${sm.done.length}건`} tone="success" />
      </StatGroup>
      <ScheduleForm key={formKey} editing={editing} onDone={() => setEditing(null)} />
      <ScheduleCalendar items={items} />
      <ScheduleTable
        onEdit={(x) => {
          setEditing({ ...x });
          scrollToId(SCHEDULE_FORM_ID);
        }}
      />
    </>
  );
}
