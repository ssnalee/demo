"use client";

import { Badge, Button, DataTable, Muted, Panel, RowActions, toast, type Column, confirmDelete, confirmDialog } from "@/components/ui";
import { nowISO } from "@/lib/date";
import { printRecord } from "@/lib/print";
import { useCollection } from "@/lib/storage/hooks";
import { read, write } from "@/lib/storage/store";
import type { Permit } from "../types";

const fmt = (v?: string) => (v ?? "").replace("T", " ");

async function setPermitStatus(id: string, status: string) {
  if (!(await confirmDialog({ title: `작업허가를 '${status}' 처리할까요?`, message: "실제 현장 안전조치를 확인한 후 처리하십시오.", confirmText: status, danger: status === "반려" }))) return;
  const a = read<Permit>("permits");
  const idx = a.findIndex((v) => v.id === id);
  if (idx < 0) return;
  const reviewer = prompt("검토·승인자 성명을 입력해 주세요.") || "";
  const next = a.slice();
  next[idx] = { ...a[idx], status, reviewer, reviewedAt: nowISO() };
  write("permits", next);
  toast(`작업허가를 '${status}' 처리했습니다.`);
}

function printPermit(x: Permit) {
  printRecord("작업허가 기록", [
    ["허가종류", x.type],
    ["층·구역", x.floor],
    ["작업시작", fmt(x.start)],
    ["작업종료", fmt(x.end)],
    ["작업내용·안전조치", x.note],
    ["신청자", x.applicant],
    ["상태", x.status],
  ]);
}

export function PermitTable({ onEdit }: { onEdit: (x: Permit) => void }) {
  const { items, remove } = useCollection<Permit>("permits");

  const columns: Column<Permit>[] = [
    {
      key: "type",
      header: "작업허가·내용",
      cell: (x) => (
        <>
          <b>
            {x.type} · {x.floor}
          </b>
          {x.note && <Muted className="whitespace-pre-wrap">{x.note}</Muted>}
        </>
      ),
    },
    {
      key: "time",
      header: "작업시간",
      cell: (x) => (
        <span className="whitespace-nowrap">
          {fmt(x.start)}
          <br />~ {fmt(x.end)}
        </span>
      ),
    },
    { key: "applicant", header: "신청자", cell: (x) => x.applicant },
    {
      key: "manage",
      header: "상태·관리",
      cell: (x) => (
        <div className="flex min-w-[170px] flex-col items-start gap-1.5">
          <Badge tone={x.status === "승인" ? "success" : x.status === "반려" ? "danger" : "warning"}>{x.status}</Badge>
          {x.reviewer && <Muted>검토자: {x.reviewer}</Muted>}
          {x.status === "신청" && (
            <div className="no-print flex gap-1">
              <Button size="sm" onClick={() => setPermitStatus(x.id, "승인")}>
                승인
              </Button>
              <Button size="sm" onClick={() => setPermitStatus(x.id, "반려")}>
                반려
              </Button>
            </div>
          )}
          <RowActions
            onEdit={() => onEdit(x)}
            onPrint={() => printPermit(x)}
            onDelete={async () => {
              if (!(await confirmDelete("이 작업허가 기록을 삭제합니다. 되돌릴 수 없습니다."))) return;
              remove(x.id);
              toast("작업허가 기록을 삭제했습니다.");
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <Panel title="허가 신청 목록" className="mt-3">
      <DataTable rows={items} columns={columns} />
    </Panel>
  );
}
