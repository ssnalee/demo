"use client";

import { PageHeader, scrollToId } from "@/components/ui";
import { today } from "@/lib/date";
import { useCollection } from "@/lib/storage/hooks";
import { useState } from "react";
import { AttendanceBulk } from "./components/attendance-bulk";
import { AttendanceForm } from "./components/attendance-form";
import { AttendanceReport } from "./components/attendance-report";
import { AttendanceTable } from "./components/attendance-table";
import { WorkerBulk } from "./components/worker-bulk";
import { WorkerDocsModal } from "./components/worker-docs-modal";
import { WORKER_FORM_ID, WorkerForm } from "./components/worker-form";
import { WorkerTable } from "./components/worker-table";
import type { Worker } from "./types";

export function WorkforcePage() {
  const { items: workers } = useCollection<Worker>("workers");
  const [editing, setEditing] = useState<Worker | null>(null);
  const [docWorkerId, setDocWorkerId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const docWorker = docWorkerId ? (workers.find((w) => w.id === docWorkerId) ?? null) : null;

  return (
    <>
      <PageHeader title="근로자·일일 출역 관리" description="근로자 기본정보와 날짜별 출역 현황을 기록합니다." />
      <WorkerBulk />
      <AttendanceBulk onSaved={setFilterDate} />
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WorkerForm editing={editing} onDone={() => setEditing(null)} />
        <AttendanceForm />
      </div>
      <WorkerTable
        onEdit={(x) => {
          setEditing({ ...x });
          scrollToId(WORKER_FORM_ID);
        }}
        onOpenDocs={setDocWorkerId}
      />
      <AttendanceTable date={filterDate || today()} onDateChange={setFilterDate} />
      <AttendanceReport />
      <WorkerDocsModal worker={docWorker} onClose={() => setDocWorkerId(null)} />
    </>
  );
}
