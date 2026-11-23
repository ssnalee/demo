"use client";

import { Badge, DataTable, Muted, Panel, RowActions, toast, type Column, confirmDelete } from "@/components/ui";
import { printRecord } from "@/lib/print";
import { useCollection } from "@/lib/storage/hooks";
import type { Inspection } from "../types";

export function InspectionTable({ onEdit }: { onEdit: (x: Inspection) => void }) {
  const { items, remove } = useCollection<Inspection>("inspections");

  const columns: Column<Inspection>[] = [
    {
      key: "where",
      header: "일자·장소",
      cell: (x) => (
        <>
          {x.date}
          <br />
          {x.floor}
        </>
      ),
    },
    {
      key: "item",
      header: "점검항목·내용",
      cell: (x) => (
        <>
          {x.item}
          {x.note && <Muted>{x.note}</Muted>}
        </>
      ),
    },
    {
      key: "result",
      header: "결과",
      cell: (x) => (
        <Badge tone={x.result === "부적합" ? "danger" : x.result === "적합" ? "success" : "neutral"}>{x.result}</Badge>
      ),
    },
    { key: "inspector", header: "점검자", cell: (x) => x.inspector },
    {
      key: "manage",
      header: "관리",
      cell: (x) => (
        <RowActions
          onEdit={() => onEdit(x)}
          onPrint={() => printInspection(x)}
          onDelete={async () => {
            if (!(await confirmDelete("이 안전점검 기록을 삭제합니다. 되돌릴 수 없습니다."))) return;
            remove(x.id);
            toast("안전점검 기록을 삭제했습니다.");
          }}
        />
      ),
    },
  ];

  return (
    <Panel title="최근 점검" className="mt-3">
      <DataTable rows={items.slice(0, 100)} columns={columns} />
    </Panel>
  );
}

function printInspection(x: Inspection) {
  printRecord("안전점검 기록", [
    ["점검일자", x.date],
    ["점검유형", x.type],
    ["층·구역", x.floor],
    ["점검자", x.inspector],
    ["점검항목", x.item],
    ["결과", x.result],
    ["점검내용·지적사항", x.note],
  ]);
}
