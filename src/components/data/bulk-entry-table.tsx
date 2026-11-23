"use client";

import { Button } from "@/components/ui";
import { useCallback, useState } from "react";
import { FieldControl, type FieldSpec } from "./field-spec";

export type BulkRow = Record<string, string> & { _key: string };

let rowSeq = 0;
const makeRow = (data: Record<string, string> = {}): BulkRow => ({ ...data, _key: `r${++rowSeq}` });

/**
 * 여러 건 한 번에 등록하는 입력 표의 상태.
 * carry: 새 줄을 추가할 때 바로 윗줄에서 이어받을 필드 (기본: floor, trade)
 */
export function useBulkRows(columns: FieldSpec[], carry: string[] = ["floor", "trade"], defaults: Record<string, string> = {}) {
  const blank = useCallback(() => {
    const d: Record<string, string> = {};
    columns.forEach((c) => {
      d[c.key] = defaults[c.key] ?? (c.type === "number" || c.type === "pct" ? "0" : c.type === "opts" ? (c.options?.[0] ?? "") : "");
    });
    return d;
  }, [columns, defaults]);

  const [rows, setRows] = useState<BulkRow[]>(() => [makeRow(blank())]);

  const add = (n = 1, data?: Record<string, string>, afterKey?: string) =>
    setRows((prev) => {
      const next = prev.slice();
      let at = afterKey ? next.findIndex((r) => r._key === afterKey) + 1 : next.length;
      for (let i = 0; i < n; i++) {
        const last = next[at - 1];
        const base = data ?? (last ? Object.fromEntries(carry.map((k) => [k, last[k] ?? ""])) : {});
        next.splice(at++, 0, makeRow({ ...blank(), ...base }));
      }
      return next;
    });

  const update = (key: string, field: string, v: string) =>
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: v } : r)));

  const remove = (key: string) =>
    setRows((prev) => {
      const next = prev.filter((r) => r._key !== key);
      return next.length ? next : [makeRow(blank())];
    });

  const copy = (key: string) => {
    const r = rows.find((x) => x._key === key);
    if (!r) return;
    const { _key, ...data } = r;
    void _key;
    add(1, data, key);
  };

  const reset = (data?: Record<string, string>[]) =>
    setRows(data?.length ? data.map((d) => makeRow({ ...blank(), ...d })) : [makeRow(blank())]);

  return { rows, add, update, remove, copy, reset };
}

export type BulkRowsState = ReturnType<typeof useBulkRows>;

export function BulkEntryTable({ columns, state }: { columns: FieldSpec[]; state: BulkRowsState }) {
  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-line px-2 py-1.5">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="border-b border-line-2 px-1 py-2 text-left text-[12.5px] font-medium whitespace-nowrap text-sub">
                  {c.label}
                  {c.placeholder && c.type === "text" && c.key === "title" && <span className="ml-1 text-sub">(비우면 자동)</span>}
                </th>
              ))}
              <th className="border-b border-line-2" />
            </tr>
          </thead>
          <tbody>
            {state.rows.map((r) => (
              <tr key={r._key}>
                {columns.map((c) => (
                  <td key={c.key} className="px-1 py-[5px]">
                    <FieldControl spec={c} value={r[c.key]} onChange={(v) => state.update(r._key, c.key, v)} />
                  </td>
                ))}
                <td className="px-1 whitespace-nowrap">
                  <button type="button" className="cursor-pointer p-1.5 text-[12.5px] text-sub hover:text-fg" onClick={() => state.copy(r._key)}>
                    복사
                  </button>
                  <button type="button" className="cursor-pointer p-1.5 text-[12.5px] text-sub hover:text-fg" onClick={() => state.remove(r._key)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => state.add()}>
          + 한 줄
        </Button>
        <Button size="sm" onClick={() => state.add(5)}>
          + 다섯 줄
        </Button>
        <span className="text-[13px] text-sub">{state.rows.length}줄</span>
      </div>
    </>
  );
}
