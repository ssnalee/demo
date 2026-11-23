"use client";

import { Badge, DataTable, Muted, Panel, RowActions, toast, type Column, confirmDelete } from "@/components/ui";
import { printRecord } from "@/lib/print";
import { useCollection } from "@/lib/storage/hooks";
import type { Training } from "../types";

const fmt = (v?: string) => (v ?? "").replace("T", " ");

function printTraining(x: Training) {
  printRecord("안전교육 기록", [
    ["교육유형", x.type],
    ["교육일시", fmt(x.date)],
    ["교육명", x.title],
    ["교육자", x.instructor],
    ["교육내용", x.content],
    ["참석인원", x.count],
    ["참석자", (x.attendees || []).join(", ")],
    ["참석확인", x.attendanceChecked ? "확인" : "미확인"],
  ]);
}

export function TrainingTable({ onEdit }: { onEdit: (x: Training) => void }) {
  const { items, remove } = useCollection<Training>("trainings");

  const columns: Column<Training>[] = [
    { key: "date", header: "일시", cell: (x) => <span className="whitespace-nowrap">{fmt(x.date)}</span> },
    { key: "type", header: "교육유형", cell: (x) => x.type },
    {
      key: "title",
      header: "교육명·참석자",
      cell: (x) => (
        <>
          <b>{x.title}</b>
          <Muted>참석자: {(x.attendees || []).join(", ") || "명단 미기재"}</Muted>
        </>
      ),
    },
    {
      key: "count",
      header: "인원·확인",
      cell: (x) => (
        <div className="flex flex-col items-start gap-1">
          {x.count}명
          <Badge tone={x.attendanceChecked ? "success" : "neutral"}>{x.attendanceChecked ? "참석확인" : "확인 전"}</Badge>
        </div>
      ),
    },
    {
      key: "manage",
      header: "관리",
      cell: (x) => (
        <RowActions
          onEdit={() => onEdit(x)}
          onPrint={() => printTraining(x)}
          onDelete={async () => {
            if (!(await confirmDelete("이 안전교육 기록을 삭제합니다. 되돌릴 수 없습니다."))) return;
            remove(x.id);
            toast("안전교육 기록을 삭제했습니다.");
          }}
        />
      ),
    },
  ];

  return (
    <Panel title="안전교육 기록 목록" className="mt-3">
      <DataTable rows={items} columns={columns} />
    </Panel>
  );
}
