"use client";

import { BulkEditBar, useSelection } from "@/components/data";
import { Badge, DataTable, Muted, Panel, RowActions, toast, type Column, confirmDelete } from "@/components/ui";
import { cn } from "@/lib/cn";
import { won } from "@/lib/format";
import { useCollection } from "@/lib/storage/hooks";
import { read } from "@/lib/storage/store";
import { useMemo } from "react";
import { WORKER_BULK_EDIT } from "../config";
import { deleteWorkerFiles } from "../files";
import { WORKER_DOC_KINDS, WORKER_INACTIVE, type Attendance, type Worker } from "../types";

export function WorkerTable({ onEdit, onOpenDocs }: { onEdit: (x: Worker) => void; onOpenDocs: (id: string) => void }) {
  const { items, remove } = useCollection<Worker>("workers");
  const ids = useMemo(() => items.map((x) => x.id), [items]);
  const sel = useSelection(ids);

  const del = async (x: Worker) => {
    if (read<Attendance>("attendance").some((a) => a.workerId === x.id))
      return toast("출역기록이 있는 근로자는 삭제할 수 없습니다. 등록 상태를 퇴사·출역종료로 변경해 주세요.", "danger");
    if (!(await confirmDelete("근로자 정보를 삭제합니다. 되돌릴 수 없습니다."))) return;
    remove(x.id);
    deleteWorkerFiles([x.id]);
    toast("근로자 정보를 삭제했습니다.");
  };

  const columns: Column<Worker>[] = [
    {
      key: "name",
      header: "성명·업체",
      cell: (x) => (
        <>
          <b>{x.name}</b>
          <Muted>{x.company || "소속 미기재"}</Muted>
        </>
      ),
    },
    { key: "trade", header: "직종", cell: (x) => x.trade || "" },
    { key: "phone", header: "연락처", cell: (x) => <span className="whitespace-nowrap">{x.phone || ""}</span> },
    { key: "wage", header: "1일 노임", cell: (x) => <span className="whitespace-nowrap">{won(x.dailyWage)}</span> },
    {
      key: "status",
      header: "상태",
      cell: (x) => <Badge tone={x.status === WORKER_INACTIVE ? "neutral" : "success"}>{x.status || "재직"}</Badge>,
    },
    {
      key: "docs",
      header: "서류",
      cell: (x) => (
        <div className="flex gap-1">
          {WORKER_DOC_KINDS.map((k) => {
            const on = !!x.docs?.[k.key];
            return (
              <button
                key={k.key}
                type="button"
                onClick={() => onOpenDocs(x.id)}
                title={on ? `${k.short} 등록됨` : `${k.short} 없음`}
                className={cn(
                  "cursor-pointer rounded-md border px-2 py-1 text-xs whitespace-nowrap",
                  on ? "border-success-soft bg-success-soft font-semibold text-success" : "border-dashed border-line text-sub hover:text-fg",
                )}
              >
                {on ? "✓ " : ""}
                {k.short}
              </button>
            );
          })}
        </div>
      ),
    },
    { key: "manage", header: "관리", cell: (x) => <RowActions onEdit={() => onEdit(x)} onDelete={() => del(x)} /> },
  ];

  return (
    <Panel
      title={
        <>
          근로자 명단 <span className="ml-1 text-sm font-medium text-sub">{items.length}명</span>
        </>
      }
    >
      <BulkEditBar config={WORKER_BULK_EDIT} selected={sel.selected} onClear={sel.clear} />
      <DataTable rows={items} columns={columns} selection={sel} empty="등록된 근로자가 없습니다." />
    </Panel>
  );
}
