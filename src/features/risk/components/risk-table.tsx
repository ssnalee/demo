"use client";

import { Badge, DataTable, Muted, Panel, PhotoThumb, RowActions, toast, type Column, confirmDelete } from "@/components/ui";
import { printRecord } from "@/lib/print";
import { useCollection } from "@/lib/storage/hooks";
import { read, write } from "@/lib/storage/store";
import { riskLevel, riskTone } from "../lib";
import type { Risk } from "../types";

export function RiskTable({ onEdit }: { onEdit: (x: Risk) => void }) {
  const { items } = useCollection<Risk>("risks");

  const columns: Column<Risk>[] = [
    { key: "date", header: "평가일", cell: (x) => <span className="whitespace-nowrap">{x.date}</span> },
    {
      key: "where",
      header: "층·공종",
      cell: (x) => (
        <>
          {x.floor} · {x.trade}
        </>
      ),
    },
    {
      key: "hazard",
      header: "위험요인·개선대책",
      cell: (x) => (
        <>
          <b>{x.hazard}</b>
          {x.control && <Muted className="whitespace-pre-wrap">{x.control}</Muted>}
          {(x.beforePhoto || x.afterPhoto) && (
            <div>
              <PhotoThumb src={x.beforePhoto} alt="위험 현장 사진" />
              <PhotoThumb src={x.afterPhoto} alt="개선 완료 사진" />
            </div>
          )}
        </>
      ),
    },
    {
      key: "score",
      header: "위험도·상태",
      cell: (x) => (
        <div className="flex flex-col items-start gap-1">
          <Badge tone={riskTone(x.score)}>
            {x.score}점 · {riskLevel(x.score)}
          </Badge>
          <span className="text-[13px]">{x.status}</span>
        </div>
      ),
    },
    {
      key: "manage",
      header: "관리",
      cell: (x) => (
        <RowActions onEdit={() => onEdit(x)} onPrint={() => printRisk(x)} onDelete={() => deleteRisk(x.id)} />
      ),
    },
  ];

  return (
    <Panel title="위험성평가 기록 목록" className="mt-3">
      <DataTable rows={items} columns={columns} />
    </Panel>
  );
}

async function deleteRisk(id: string) {
  const risks = read<Risk>("risks");
  if (!risks.some((v) => String(v.id) === String(id))) return toast("삭제할 위험성평가 기록을 찾지 못했습니다.", "danger");
  if (!(await confirmDelete("이 위험성평가를 삭제합니다.\n연결된 개선조치도 함께 삭제됩니다."))) return;
  write(
    "risks",
    risks.filter((v) => String(v.id) !== String(id)),
  );
  write(
    "actions",
    read<{ riskId?: string }>("actions").filter((v) => String(v.riskId) !== String(id)),
  );
  toast("위험성평가와 연결 개선조치를 삭제했습니다.");
}

function printRisk(x: Risk) {
  printRecord(
    "위험성평가 기록",
    [
      ["평가일자", x.date],
      ["평가유형", x.type],
      ["층·구역", x.floor],
      ["공종", x.trade],
      ["위험분야", x.category],
      ["담당자", x.owner],
      ["위험요인", x.hazard],
      ["예상재해·기존조치", x.existing],
      ["가능성", x.likelihood],
      ["중대성", x.severity],
      ["위험도", x.score],
      ["개선대책", x.control],
      ["조치기한", x.due],
      ["상태", x.status],
    ],
    [
      ["위험 현장 사진", x.beforePhoto],
      ["개선 완료 사진", x.afterPhoto],
    ],
  );
}
