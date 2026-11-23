"use client";

import { BulkEditBar, useSelection, type BulkEditConfig } from "@/components/data";
import { DataTable, Panel, compactControlClass, toast, type Column, confirmDelete } from "@/components/ui";
import { cn } from "@/lib/cn";
import { PCT_OPTIONS } from "@/constants/options";
import { bulkUpdateProcesses, deleteProcesses, setProcessProgress } from "@/server/actions/processes";
import { useMemo, useState } from "react";
import { processStats, sortByStart } from "../lib";
import type { Process, ProcessStatus } from "../types";
import { STATUS_STYLE } from "./gantt-chart";
import { reloadProcesses, useProcesses } from "../store";

const BULK_FIELDS: BulkEditConfig<Process>["fields"] = [
  { key: "progress", label: "진행률", type: "pct" },
  { key: "__shift", label: "기간 옮기기 (일)", type: "shift", shiftKeys: ["start", "end"] },
  { key: "start", label: "시작일", type: "date" },
  { key: "end", label: "종료일", type: "date" },
  { key: "company", label: "담당 업체", type: "company" },
];

/** 일괄 변경·삭제를 서버(DB)로 처리 */
function processBulk(siteId: string): BulkEditConfig<Process> {
  return {
    collection: "processes",
    entityName: "공정",
    fields: BULK_FIELDS,
    remote: {
      apply: async (ids, change) => {
        const r = await bulkUpdateProcesses(
          siteId,
          ids,
          change.kind === "shift"
            ? change
            : { kind: "set", field: change.key as "progress" | "start" | "end" | "company", value: change.value },
        );
        if (!r.ok) return r.error;
        await reloadProcesses(siteId);
      },
      remove: async (ids) => {
        const r = await deleteProcesses(siteId, ids);
        if (!r.ok) return r.error;
        await reloadProcesses(siteId);
      },
    },
  };
}

const FILTERS: ("전체" | ProcessStatus)[] = ["전체", "진행 중", "지연 우려", "지연", "예정", "완료"];
const short = (d: string) => d.slice(5).replace("-", ".");

/** 상태 표시 (막대표와 같은 색) */
function StatusPill({ st }: { st: ProcessStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-fill px-2.5 py-[3px] text-[12px] font-semibold whitespace-nowrap text-fg-2">
      <span className={cn("size-1.5 rounded-full", STATUS_STYLE[st].dot)} />
      {st}
    </span>
  );
}

/** 진행률: 작은 막대 + 계획 위치 눈금 + %를 눌러 바로 변경 */
function ProgressCell({ x, onChange }: { x: Process; onChange: (v: string) => void }) {
  const k = processStats(x);
  const st = STATUS_STYLE[k.st];
  const opts = [...PCT_OPTIONS, ...(k.p % 10 ? [k.p] : [])].sort((a, b) => a - b);
  return (
    <div className="mx-auto w-[150px] text-left" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <label className="relative inline-flex cursor-pointer items-center gap-0.5 text-[13px] font-bold text-fg">
          <select
            aria-label="진행률 변경"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={String(k.p)}
            onChange={(e) => onChange(e.target.value)}
          >
            {opts.map((v) => (
              <option key={v} value={v}>
                {v}%
              </option>
            ))}
          </select>
          {k.p}%
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="text-[#98a2b3]" aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </label>
        <span className="text-[11.5px] text-sub">계획 {k.planned.toFixed(0)}%</span>
      </div>
      <div className={cn("relative mt-1.5 h-1.5 rounded-full", st.track)}>
        <div className={cn("h-full rounded-full", st.fill)} style={{ width: `${k.p}%` }} />
        {/* 계획 위치 눈금 */}
        <span className="absolute -top-0.5 h-2.5 w-0.5 rounded-full bg-fg/40" style={{ left: `calc(${k.planned}% - 1px)` }} />
      </div>
    </div>
  );
}

function IconButton({ label, danger, onClick, children }: { label: string; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "grid size-8 cursor-pointer place-items-center rounded-lg border border-line bg-white shadow-xs",
        danger ? "text-danger" : "text-fg-2",
      )}
    >
      {children}
    </button>
  );
}

export function ProcessTable({ onEdit }: { onEdit: (x: Process) => void }) {
  const { items = [], siteId } = useProcesses();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("전체");
  const [q, setQ] = useState("");

  const all = useMemo(() => sortByStart(items).map((x) => ({ x, st: processStats(x).st })), [items]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { 전체: all.length };
    all.forEach(({ st }) => (c[st] = (c[st] ?? 0) + 1));
    return c;
  }, [all]);
  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return all
      .filter(({ st }) => filter === "전체" || st === filter)
      .filter(({ x }) => !kw || [x.title, x.company, x.trade, x.floor].some((v) => (v || "").toLowerCase().includes(kw)))
      .map(({ x }) => x);
  }, [all, filter, q]);
  const ids = useMemo(() => list.map((x) => x.id), [list]);
  const sel = useSelection(ids);

  const setProgress = async (id: string, v: string) => {
    const r = await setProcessProgress(siteId, id, Number(v) || 0);
    if (!r.ok) return toast(r.error, "danger");
    await reloadProcesses(siteId);
  };

  const columns: Column<Process>[] = [
    {
      key: "title",
      header: "공정",
      cell: (x) => (
        <div className="min-w-[200px]">
          <div className="flex items-center gap-2">
            <span className={cn("size-2 flex-none rounded-full", STATUS_STYLE[processStats(x).st].dot)} />
            <b className="text-[13.5px]">{x.title}</b>
          </div>
          <div className="mt-0.5 pl-4 text-[12px] text-sub">
            {x.trade} · {x.floor}
            {x.after ? ` · 선행: ${x.after}` : ""}
          </div>
        </div>
      ),
    },
    { key: "company", header: "담당 업체", className: "text-center", headerClassName: "text-center", cell: (x) => x.company || <span className="text-[#98a2b3]">-</span> },
    {
      key: "period",
      header: "기간",
      className: "text-center",
      headerClassName: "text-center",
      cell: (x) => (
        <div className="whitespace-nowrap">
          <span className="font-medium text-fg">
            {short(x.start)} ~ {short(x.end)}
          </span>
          <span className="ml-1.5 rounded-md bg-fill px-1.5 py-px text-[11.5px] text-sub">{processStats(x).dur}일</span>
        </div>
      ),
    },
    { key: "progress", header: "진행률", className: "text-center", headerClassName: "text-center", cell: (x) => <ProgressCell x={x} onChange={(v) => setProgress(x.id, v)} /> },
    { key: "status", header: "상태", className: "text-center", headerClassName: "text-center", cell: (x) => <StatusPill st={processStats(x).st} /> },
    {
      key: "manage",
      header: "",
      headerClassName: "w-[88px]",
      cell: (x) => (
        <div className="no-print flex justify-end gap-1.5">
          <IconButton label="수정" onClick={() => onEdit(x)}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
            </svg>
          </IconButton>
          <IconButton
            label="삭제"
            danger
            onClick={async () => {
              if (!(await confirmDelete("이 공정을 삭제합니다. 되돌릴 수 없습니다."))) return;
              const r = await deleteProcesses(siteId, [x.id]);
              if (!r.ok) return toast(r.error, "danger");
              await reloadProcesses(siteId);
              toast("공정을 삭제했습니다.");
            }}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
            </svg>
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <Panel title="공정 목록">
      {/* 상태 거르기 + 검색 */}
      <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const on = filter === f;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-medium",
                  on ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-white text-fg-2",
                )}
              >
                {f !== "전체" && <span className={cn("size-1.5 rounded-full", STATUS_STYLE[f].dot)} />}
                {f}
                <span className={cn("tabular-nums", on ? "text-brand-strong" : "text-[#98a2b3]")}>{counts[f] ?? 0}</span>
              </button>
            );
          })}
        </div>
        <input
          type="search"
          placeholder="공정·업체 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={cn(compactControlClass, "w-full sm:w-[220px]")}
        />
      </div>
      <BulkEditBar config={processBulk(siteId)} selected={sel.selected} onClear={sel.clear} />
      <DataTable
        rows={list}
        columns={columns}
        selection={sel}
        onRowClick={onEdit}
        empty={items.length ? "조건에 맞는 공정이 없습니다." : "등록된 공정이 없습니다."}
      />
    </Panel>
  );
}
