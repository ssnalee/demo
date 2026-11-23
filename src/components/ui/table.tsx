"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { EmptyState } from "./notice";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface RowSelection {
  selected: Set<string>;
  toggle: (id: string, on: boolean) => void;
  toggleAll: (on: boolean) => void;
  allChecked: boolean;
  someChecked: boolean;
}

/** 기본 데이터 표. selection을 넘기면 맨 앞에 체크박스 열이 생김 */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  selection,
  empty,
  onRowClick,
  rowClassName,
  className,
  compactEmpty,
}: {
  rows: T[];
  columns: Column<T>[];
  selection?: RowSelection;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  className?: string;
  /** 빈 상태를 아이콘 없이 한 줄로 (요약 카드용) */
  compactEmpty?: boolean;
}) {
  if (!rows.length)
    return compactEmpty ? (
      <p className="rounded-xl bg-[#f8f9fc] px-4 py-3 text-[13px] text-sub">{empty ?? "등록된 자료가 없습니다."}</p>
    ) : (
      <EmptyState>{empty}</EmptyState>
    );
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-separate border-spacing-0 text-[13.5px]">
        <thead>
          <tr>
            {selection && (
              <th className="no-print w-[34px] border-y border-l border-line-2 bg-[#f9fafb] px-3 py-2.5 text-left align-middle leading-none first:rounded-l-lg">
                <input
                  type="checkbox"
                  aria-label="전체 선택"
                  checked={selection.allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = selection.someChecked && !selection.allChecked;
                  }}
                  onChange={(e) => selection.toggleAll(e.target.checked)}
                />
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "border-y border-line-2 bg-[#f9fafb] px-3 py-2.5 text-left align-middle text-[12px] font-semibold whitespace-nowrap text-sub first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r",
                  c.headerClassName,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const on = selection?.selected.has(row.id);
            return (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "group transition-colors [&>td]:border-b [&>td]:border-line-2 last:[&>td]:border-b-0",
                  onRowClick && "cursor-pointer",
                  on ? "bg-brand-soft/60" : "hover:bg-[#f9fafb]",
                  rowClassName?.(row),
                )}
              >
                {selection && (
                  <td className="no-print w-[34px] px-3 py-3.5 align-middle leading-none" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label="선택"
                      checked={!!on}
                      onChange={(e) => selection.toggle(row.id, e.target.checked)}
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-3 py-3.5 align-middle text-fg-2 [&_b]:font-semibold [&_b]:text-fg", c.className)}>
                    {c.cell(row, i)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
