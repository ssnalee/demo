"use client";

import { BulkEditBar, GridEditModal, useSelection } from "@/components/data";
import { Badge, Button, DataTable, Field, FormGrid, Input, Muted, Panel, PhotoThumb, RowActions, Select, Tag, toast, type Column, confirmDelete } from "@/components/ui";
import { useCollection } from "@/lib/storage/hooks";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useMemo, useState } from "react";
import { WORKDIARY_BULK_EDIT, WORKDIARY_GRID, printWorkDiary } from "../lib";
import { PHOTO_STAGES, type WorkDiary } from "../types";

export function WorkDiaryTable({ onEdit, onCopy }: { onEdit: (x: WorkDiary) => void; onCopy: (x: WorkDiary) => void }) {
  const { items, get, remove } = useCollection<WorkDiary>("workdiaries");
  const { floorGroups } = useGroupedMasters();
  const [filter, setFilter] = useState({ date: "", floor: "" });
  const [grid, setGrid] = useState<{ ids: string[]; fromSelection: boolean } | null>(null);

  const rows = useMemo(
    () => items.filter((x) => (!filter.date || x.date === filter.date) && (!filter.floor || x.floor === filter.floor)),
    [items, filter],
  );
  const visibleIds = useMemo(() => rows.map((x) => x.id), [rows]);
  const selection = useSelection(visibleIds);

  const openGrid = () => {
    const fromSelection = selection.selected.size > 0;
    const ids = fromSelection ? selection.ids : visibleIds;
    if (!ids.length) return toast("수정할 기록이 없습니다.", "danger");
    setGrid({ ids, fromSelection });
  };

  const withRecord = (id: string, fn: (x: WorkDiary) => void) => {
    const x = get(id);
    if (x) fn(x);
  };

  const columns: Column<WorkDiary>[] = [
    {
      key: "where",
      header: "작업일·층·시간",
      cell: (x) => (
        <>
          <b>
            {x.date} · {x.floor}
          </b>
          <br />
          {x.trade}
          <Muted>
            {x.start || "시간 미기재"}~{x.end || "미기재"}
          </Muted>
        </>
      ),
    },
    {
      key: "work",
      header: "작업실적·인원·진행률",
      className: "min-w-[220px]",
      cell: (x) => (
        <>
          <b>{x.title}</b>
          <Muted className="whitespace-pre-line">{x.actual}</Muted>
          {PHOTO_STAGES.some(([s]) => x.photos?.[s]) && (
            <div>
              {PHOTO_STAGES.map(([s, label]) => (
                <PhotoThumb key={s} src={x.photos?.[s]} alt={`${label} 사진`} />
              ))}
            </div>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Tag>계획 {Number(x.plannedWorkers) || 0}명</Tag>
            <Tag>실제 {Number(x.actualWorkers) || 0}명</Tag>
            <Tag>진행 {Number(x.progress) || 0}%</Tag>
          </div>
        </>
      ),
    },
    {
      key: "leader",
      header: "책임자·사고여부",
      cell: (x) => (
        <>
          {x.leader || "미기재"}
          <div className="mt-1">
            <Badge tone={x.incident === "없음" ? "success" : "neutral"}>{x.incident || "미기재"}</Badge>
          </div>
          <Muted>확인: {x.confirmedBy || "미확인"}</Muted>
        </>
      ),
    },
    {
      key: "manage",
      header: "관리",
      cell: (x) => (
        <RowActions
          onEdit={() => withRecord(x.id, onEdit)}
          onPrint={() => withRecord(x.id, printWorkDiary)}
          onDelete={async () => {
            if (!(await confirmDelete("이 작업일보를 삭제합니다. 되돌릴 수 없습니다."))) return;
            remove(x.id);
            toast("작업일보를 삭제했습니다.");
          }}
        >
          <Button size="sm" onClick={() => withRecord(x.id, onCopy)}>
            복사
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <Panel
      className="mt-3"
      title={
        <span className="flex items-center gap-2.5">
          작업일보 현황 <Badge dot={false}>{rows.length}건</Badge>
        </span>
      }
      actions={
        <Button size="sm" className="no-print" onClick={openGrid}>
          표로 한 번에 수정
        </Button>
      }
    >
      <FormGrid className="no-print">
        <Field label="작업일 검색">
          <Input type="date" value={filter.date} onChange={(e) => setFilter({ ...filter, date: e.target.value })} />
        </Field>
        <Field label="층·구역 필터">
          <Select
            placeholder="전체 층·구역"
            groups={floorGroups}
            value={filter.floor}
            onChange={(e) => setFilter({ ...filter, floor: e.target.value })}
          />
        </Field>
      </FormGrid>
      <BulkEditBar config={WORKDIARY_BULK_EDIT} selected={selection.selected} onClear={selection.clear} onOpenGrid={openGrid} />
      <DataTable rows={rows} columns={columns} selection={selection} />
      <GridEditModal
        open={!!grid}
        onClose={() => setGrid(null)}
        config={WORKDIARY_GRID}
        ids={grid?.ids ?? []}
        fromSelection={!!grid?.fromSelection}
      />
    </Panel>
  );
}
