"use client";

import {
  BulkEditBar,
  GridEditModal,
  useSelection,
  type BulkEditConfig,
  type GridEditConfig,
} from "@/components/data";
import { Badge, Button, DataTable, Muted, Panel, PhotoThumb, RowActions, Select, toast, type Column, confirmDelete } from "@/components/ui";
import { downloadCSV } from "@/lib/download";
import { printRecord, printTable } from "@/lib/print";
import { useCollection } from "@/lib/storage/hooks";
import { useMemo, useState } from "react";
import { DEFECT_STATUSES, DEFECT_TYPES, type Defect } from "../types";

/** 원본 BE_CFG.defectTable */
const BULK_CONFIG: BulkEditConfig<Defect> = {
  collection: "defects",
  entityName: "하자",
  fields: [
    { key: "status", label: "진행 상태", type: "opts", options: [...DEFECT_STATUSES] },
    { key: "planDate", label: "보수 예정일", type: "date" },
    { key: "doneDate", label: "실제 보수일", type: "date" },
    { key: "company", label: "보수업체", type: "company" },
    { key: "contact", label: "담당자·연락처", type: "text" },
    { key: "type", label: "하자 유형", type: "opts", options: [...DEFECT_TYPES] },
    { key: "floor", label: "층·구역", type: "floor" },
    { key: "trade", label: "공종", type: "trade" },
  ],
};

/** 원본 GRID_CFG.defectTable */
const GRID_CONFIG: GridEditConfig = {
  collection: "defects",
  title: "하자보수 표로 한 번에 수정",
  columns: [
    { key: "date", label: "접수일", type: "date", width: 140 },
    { key: "floor", label: "층·구역", type: "floor", width: 120 },
    { key: "trade", label: "공종", type: "trade", width: 130 },
    { key: "location", label: "발생 위치", type: "text", width: 160 },
    { key: "type", label: "하자 유형", type: "opts", width: 120, options: [...DEFECT_TYPES] },
    { key: "content", label: "하자 내용", type: "area", width: 240 },
    { key: "company", label: "보수업체", type: "text", width: 130 },
    { key: "contact", label: "담당자·연락처", type: "text", width: 150 },
    { key: "planDate", label: "보수 예정일", type: "date", width: 140 },
    { key: "doneDate", label: "실제 보수일", type: "date", width: 140 },
    { key: "status", label: "상태", type: "opts", width: 96, options: [...DEFECT_STATUSES] },
    { key: "action", label: "보수 내용·조치 결과", type: "area", width: 240 },
  ],
};

const statusTone = (s: string) => (s === "완료" ? "success" : s === "재발" ? "danger" : s === "보수중" ? "warning" : "neutral");

function printDefect(x: Defect) {
  printRecord(
    "준공 후 하자보수 기록",
    [
      ["접수일", x.date],
      ["층·구역", x.floor],
      ["공종", x.trade],
      ["발생 위치", x.location],
      ["하자 유형", x.type],
      ["하자 내용", x.content],
      ["보수 담당업체", x.company],
      ["담당자·연락처", x.contact],
      ["보수 예정일", x.planDate],
      ["실제 보수일", x.doneDate],
      ["진행 상태", x.status],
      ["보수 내용·조치 결과", x.action],
      ["비고", x.note],
    ],
    [
      ["하자 발생", x.photos?.before],
      ["보수 완료", x.photos?.after],
    ],
  );
}

function exportCSV(list: Defect[]) {
  const rows: (string | undefined)[][] = [
    ["접수일", "층·구역", "공종", "발생 위치", "하자 유형", "하자 내용", "담당업체", "담당자·연락처", "보수 예정일", "실제 보수일", "상태", "보수 내용·조치", "비고", "발생 사진", "완료 사진"],
  ];
  list.forEach((x) =>
    rows.push([
      x.date,
      x.floor,
      x.trade,
      x.location,
      x.type,
      x.content,
      x.company,
      x.contact,
      x.planDate,
      x.doneDate,
      x.status,
      x.action,
      x.note,
      x.photos?.before ? "있음" : "",
      x.photos?.after ? "있음" : "",
    ]),
  );
  downloadCSV(rows, "준공후_하자보수_목록.csv");
}

function printList(list: Defect[], filter: string) {
  printTable(
    "준공 후 하자보수 접수 목록" + (filter ? ` (${filter})` : ""),
    ["접수일", "층·위치", "공종·유형", "하자 내용", "보수 내용", "담당업체", "예정일", "보수일", "상태"],
    list.map((x) => [
      x.date,
      `${x.floor} · ${x.location}`,
      `${x.trade} / ${x.type}`,
      x.content,
      x.action,
      [x.company, x.contact].filter(Boolean).join(" "),
      x.planDate,
      x.doneDate,
      x.status,
    ]),
  );
}

export function DefectTable({ onEdit }: { onEdit: (x: Defect) => void }) {
  const { items, remove } = useCollection<Defect>("defects");
  const [filter, setFilter] = useState("");
  const rows = useMemo(() => items.filter((x) => !filter || x.status === filter), [items, filter]);
  const visibleIds = useMemo(() => rows.map((x) => x.id), [rows]);
  const selection = useSelection(visibleIds);
  const [grid, setGrid] = useState<{ ids: string[]; fromSelection: boolean } | null>(null);

  const openGrid = () => {
    const fromSelection = selection.selected.size > 0;
    const ids = fromSelection ? selection.ids : visibleIds;
    if (!ids.length) return toast("수정할 기록이 없습니다.", "danger");
    setGrid({ ids, fromSelection });
  };

  const columns: Column<Defect>[] = [
    {
      key: "where",
      header: "접수일·위치",
      cell: (x) => (
        <>
          <span className="whitespace-nowrap">{x.date}</span>
          <br />
          {x.floor} · {x.location}
        </>
      ),
    },
    {
      key: "type",
      header: "공종·유형",
      cell: (x) => (
        <>
          {x.trade}
          <br />
          {x.type}
        </>
      ),
    },
    {
      key: "content",
      header: "하자 내용·조치",
      cell: (x) => (
        <>
          <b className="whitespace-pre-wrap">{x.content}</b>
          {x.action && <Muted className="whitespace-pre-wrap">{x.action}</Muted>}
          {(x.photos?.before || x.photos?.after) && (
            <div>
              <PhotoThumb src={x.photos?.before} alt="발생 사진" />
              <PhotoThumb src={x.photos?.after} alt="완료 사진" />
            </div>
          )}
        </>
      ),
    },
    {
      key: "company",
      header: "담당업체·담당자",
      cell: (x) => (
        <>
          {x.company || "업체 미지정"}
          {x.contact && (
            <>
              <br />
              {x.contact}
            </>
          )}
        </>
      ),
    },
    {
      key: "schedule",
      header: "보수 일정",
      cell: (x) => (
        <span className="whitespace-nowrap">
          {x.planDate || "미정"}
          {x.doneDate && (
            <>
              <br />
              {x.doneDate}
            </>
          )}
        </span>
      ),
    },
    { key: "status", header: "상태", cell: (x) => <Badge tone={statusTone(x.status)}>{x.status}</Badge> },
    {
      key: "manage",
      header: "관리",
      cell: (x) => (
        <RowActions
          onEdit={() => onEdit(x)}
          onPrint={() => printDefect(x)}
          onDelete={async () => {
            if (!(await confirmDelete("이 하자보수 기록을 삭제합니다. 되돌릴 수 없습니다."))) return;
            remove(x.id);
            toast("하자보수 기록을 삭제했습니다.");
          }}
        />
      ),
    },
  ];

  return (
    <Panel
      className="mt-3"
      title={
        <span className="flex flex-wrap items-center gap-2.5">
          하자보수 접수 목록
          <Button size="sm" className="no-print" onClick={openGrid}>
            표로 한 번에 수정
          </Button>
        </span>
      }
      actions={
        <div className="no-print flex flex-wrap items-center gap-2">
          <Select
            compact
            className="w-auto min-w-[130px]"
            placeholder="전체 상태"
            options={[...DEFECT_STATUSES]}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Button size="sm" onClick={() => exportCSV(items)}>
            CSV 내보내기
          </Button>
          <Button size="sm" onClick={() => printList(rows, filter)}>
            인쇄 / PDF
          </Button>
        </div>
      }
    >
      <BulkEditBar config={BULK_CONFIG} selected={selection.selected} onClear={selection.clear} onOpenGrid={openGrid} />
      <DataTable rows={rows} columns={columns} selection={selection} />
      <GridEditModal
        open={!!grid}
        onClose={() => setGrid(null)}
        config={GRID_CONFIG}
        ids={grid?.ids ?? []}
        fromSelection={!!grid?.fromSelection}
      />
    </Panel>
  );
}
