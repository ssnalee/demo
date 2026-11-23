"use client";

import { BulkEditBar, useSelection, type BulkEditConfig } from "@/components/data";
import { Badge, DataTable, Field, FormGrid, Input, Muted, Panel, RowActions, Select, Tag, toast, type Column, confirmDelete } from "@/components/ui";
import { bulkUpdateWorkplans, deleteWorkplans, type WorkplanBulkChange } from "@/server/actions/workplans";
import { dotDate } from "@/lib/date";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useMemo, useState } from "react";
import { WORKPLAN_BULK_FIELDS, printWorkplan } from "../lib";
import { reloadWorkplans, useWorkplans } from "../store";
import { WORKPLAN_STATUSES, isWorkplanDone, type Workplan } from "../types";

/** 일괄 변경·삭제를 서버(DB)로 처리 */
function workplanBulk(siteId: string): BulkEditConfig<Workplan> {
  return {
    collection: "workplans",
    entityName: "작업계획서",
    fields: WORKPLAN_BULK_FIELDS,
    remote: {
      apply: async (ids, change) => {
        const r = await bulkUpdateWorkplans(
          siteId,
          ids,
          change.kind === "shift"
            ? change
            : { kind: "set", field: change.key as Extract<WorkplanBulkChange, { kind: "set" }>["field"], value: change.value },
        );
        if (!r.ok) return r.error;
        await reloadWorkplans(siteId);
      },
      remove: async (ids) => {
        const r = await deleteWorkplans(siteId, ids);
        if (!r.ok) return r.error;
        await reloadWorkplans(siteId);
      },
    },
  };
}

export function WorkplanTable({ onEdit }: { onEdit: (x: Workplan) => void }) {
  const { items = [], siteId, error } = useWorkplans();
  const get = (id: string) => items.find((x) => x.id === id);
  const { floorGroups, tradeGroups } = useGroupedMasters();
  const [filter, setFilter] = useState({ date: "", floor: "", trade: "", status: "" });

  const rows = useMemo(
    () =>
      items.filter(
        (x) =>
          (!filter.date || x.date === filter.date) &&
          (!filter.floor || x.floor === filter.floor) &&
          (!filter.trade || x.trade === filter.trade) &&
          (!filter.status || x.status === filter.status),
      ),
    [items, filter],
  );
  const visibleIds = useMemo(() => rows.map((x) => x.id), [rows]);
  const selection = useSelection(visibleIds);

  const withRecord = (id: string, fn: (x: Workplan) => void) => {
    const x = get(id);
    if (!x) return toast("해당 작업계획서를 찾지 못했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.", "danger");
    fn(x);
  };

  const columns: Column<Workplan>[] = [
    {
      key: "where",
      header: "작업일·층·공종",
      className: "whitespace-nowrap",
      cell: (x) => (
        <>
          <b>{dotDate(x.date)}</b>
          <br />
          {x.floor} · {x.trade}
          <Muted>{x.location || "위치 미기재"}</Muted>
        </>
      ),
    },
    {
      key: "work",
      header: "작업내용",
      className: "min-w-[220px]",
      cell: (x) => (
        <>
          <b>{x.title}</b>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Tag>인원 {Number(x.workers) || 0}명</Tag>
            <Tag>
              {x.start || "시간 미정"}~{x.end || "미정"}
            </Tag>
            {x.type && <Tag>{x.type}</Tag>}
          </div>
        </>
      ),
    },
    {
      key: "leader",
      header: "책임자",
      className: "whitespace-nowrap",
      cell: (x) => (
        <>
          {x.leader || "미지정"}
          <Muted>검토: {x.reviewer || "미지정"}</Muted>
        </>
      ),
    },
    {
      key: "status",
      header: "상태",
      headerClassName: "text-center",
      className: "text-center whitespace-nowrap",
      cell: (x) => <Badge tone={isWorkplanDone(x.status) ? "success" : "neutral"}>{x.status}</Badge>,
    },
    {
      key: "manage",
      header: "관리",
      className: "w-px",
      cell: (x) => (
        <RowActions
          nowrap
          onEdit={() => withRecord(x.id, onEdit)}
          onPrint={() => withRecord(x.id, printWorkplan)}
          onDelete={() =>
            withRecord(x.id, async () => {
              if (!(await confirmDelete("이 작업계획서를 삭제합니다. 되돌릴 수 없습니다."))) return;
              const r = await deleteWorkplans(siteId, [x.id]);
              if (!r.ok) return toast(r.error, "danger");
              await reloadWorkplans(siteId);
              toast("작업계획서를 삭제했습니다.");
            })
          }
        />
      ),
    },
  ];

  return (
    <Panel
      className="mt-3"
      title={
        <span className="flex items-center gap-2.5">
          작업계획서 목록 <Badge dot={false}>{rows.length}건</Badge>
        </span>
      }
    >
      <FormGrid
        cols={4}
        className="no-print lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)]"
      >
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
        <Field label="공종 필터">
          <Select
            placeholder="전체 공종"
            groups={tradeGroups}
            value={filter.trade}
            onChange={(e) => setFilter({ ...filter, trade: e.target.value })}
          />
        </Field>
        <Field label="상태 필터">
          <Select
            placeholder="전체 상태"
            options={[...WORKPLAN_STATUSES]}
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          />
        </Field>
      </FormGrid>
      {error && <p className="mb-3 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">{error}</p>}
      <BulkEditBar config={workplanBulk(siteId)} selected={selection.selected} onClear={selection.clear} />
      <DataTable rows={rows} columns={columns} selection={selection} />
    </Panel>
  );
}
