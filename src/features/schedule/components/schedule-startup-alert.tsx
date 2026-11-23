"use client";

import { Badge, Button, DataTable, Modal, Muted, type Column } from "@/components/ui";
import { read } from "@/lib/storage/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { priorityTone, scheduleAlertItems, scheduleRange } from "../lib";
import type { Schedule } from "../types";

const SESSION_KEY = "scheduleAlertShown";

type Alert = ReturnType<typeof scheduleAlertItems>;

const columns: Column<Schedule>[] = [
  { key: "date", header: "일정일", cell: (x) => scheduleRange(x) },
  {
    key: "title",
    header: "일정명",
    cell: (x) => (
      <>
        <b>{x.title}</b>
        <Muted>
          {x.category} · {x.floor}
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
];

/**
 * 앱을 처음 열 때(브라우저 세션당 한 번) 오늘·기한 초과·임박 중요일정을 알려 주는 모달.
 * 앱 셸에 한 번만 렌더링합니다.
 */
export function ScheduleStartupAlert({ schedulePath = "/schedule" }: { schedulePath?: string }) {
  const router = useRouter();
  const [alert, setAlert] = useState<Alert | null>(null);

  useEffect(() => {
    let shown = false;
    try {
      shown = !!sessionStorage.getItem(SESSION_KEY);
      if (!shown) sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      shown = false;
    }
    if (shown) return;
    const timer = setTimeout(() => {
      const res = scheduleAlertItems(read<Schedule>("schedules"));
      if (res.relevant.length) setAlert(res);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  const close = () => setAlert(null);
  if (!alert) return null;

  return (
    <Modal
      open
      onClose={close}
      size="lg"
      title="일정 알림"
      description={`기한 초과 ${alert.overdue.length}건 · 오늘 일정 ${alert.due.length}건 · 임박 중요일정 ${alert.soon.length}건`}
      footer={
        <>
          <Button
            variant="primary"
            onClick={() => {
              close();
              router.push(schedulePath);
            }}
          >
            일정관리 열기
          </Button>
          <Button onClick={close}>확인</Button>
        </>
      }
    >
      <DataTable rows={alert.relevant} columns={columns} />
    </Modal>
  );
}
