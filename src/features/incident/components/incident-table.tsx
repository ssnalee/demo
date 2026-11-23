"use client";

import { Badge, DataTable, Muted, Panel, RowActions, toast, type Column, confirmDelete } from "@/components/ui";
import { printRecord } from "@/lib/print";
import { useCollection } from "@/lib/storage/hooks";
import type { Incident } from "../types";

const fmt = (v?: string) => (v ?? "").replace("T", " ");

function printIncident(x: Incident) {
  printRecord("사고·아차사고 기록", [
    ["유형", x.type],
    ["발생일시", fmt(x.date)],
    ["층·구역", x.floor],
    ["보고자", x.reporter],
    ["발생상황", x.narrative],
    ["즉시조치·재발방지", x.action],
  ]);
}

export function IncidentTable({ onEdit }: { onEdit: (x: Incident) => void }) {
  const { items, remove } = useCollection<Incident>("incidents");

  const columns: Column<Incident>[] = [
    { key: "date", header: "일시", cell: (x) => <span className="whitespace-nowrap">{fmt(x.date)}</span> },
    {
      key: "type",
      header: "유형·장소",
      cell: (x) => (
        <div className="flex flex-col items-start gap-1">
          <Badge tone={x.type === "아차사고" ? "warning" : "danger"}>{x.type}</Badge>
          {x.floor}
        </div>
      ),
    },
    {
      key: "narrative",
      header: "내용·조치",
      cell: (x) => (
        <>
          <span className="whitespace-pre-wrap">{x.narrative}</span>
          {x.action && <Muted className="whitespace-pre-wrap">{x.action}</Muted>}
        </>
      ),
    },
    { key: "reporter", header: "보고자", cell: (x) => x.reporter },
    {
      key: "manage",
      header: "관리",
      cell: (x) => (
        <RowActions
          onEdit={() => onEdit(x)}
          onPrint={() => printIncident(x)}
          onDelete={async () => {
            if (!(await confirmDelete("이 사고·아차사고 기록을 삭제합니다. 되돌릴 수 없습니다."))) return;
            remove(x.id);
            toast("사고·아차사고 기록을 삭제했습니다.");
          }}
        />
      ),
    },
  ];

  return (
    <Panel title="사고·아차사고 목록" className="mt-3">
      <DataTable rows={items} columns={columns} />
    </Panel>
  );
}
