"use client";

import { Button, Modal, toast, confirmDialog } from "@/components/ui";
import { cn } from "@/lib/cn";
import { nowISO } from "@/lib/date";
import type { CollectionKey } from "@/lib/storage/keys";
import { read, write } from "@/lib/storage/store";
import { useMemo, useState } from "react";
import { FieldControl, coerceFieldValue, type FieldSpec } from "./field-spec";

type Row = Record<string, unknown> & { id: string };
const LINK = Symbol("link");

export interface GridEditConfig {
  collection: CollectionKey;
  title: string;
  columns: FieldSpec[];
  /**
   * 연결된 다른 컬렉션의 필드를 같이 수정하는 열 (예: 작업일보 → 연결된 작업계획서의 scope)
   * key는 "__link" 처럼 원본에 없는 이름을 쓰고, link에 대상 정보를 넣습니다.
   */
  link?: {
    key: string;
    label: string;
    collection: CollectionKey;
    foreignKey: string;
    field: string;
    width?: number;
    /** 이 열 key 바로 다음에 표시 (없으면 맨 끝) */
    after?: string;
  };
}

/** 여러 건을 스프레드시트처럼 한 화면에서 수정 */
export function GridEditModal({
  open,
  onClose,
  config,
  ids,
  fromSelection,
}: {
  open: boolean;
  onClose: () => void;
  config: GridEditConfig;
  ids: string[];
  fromSelection: boolean;
}) {
  if (!open) return null;
  return <GridEditInner onClose={onClose} config={config} ids={ids} fromSelection={fromSelection} />;
}

function GridEditInner({
  onClose,
  config,
  ids,
  fromSelection,
}: {
  onClose: () => void;
  config: GridEditConfig;
  ids: string[];
  fromSelection: boolean;
}) {
  const initial = useMemo(() => {
    const all = read<Row>(config.collection);
    return ids.map((id) => all.find((x) => x.id === id)).filter(Boolean) as Row[];
  }, [config.collection, ids]);
  const linked = useMemo(
    () => (config.link ? read<Row>(config.link.collection) : []),
    [config.link],
  );
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});
  const changed = Object.keys(edits).length;
  const order = useMemo(() => {
    const cols: (FieldSpec | typeof LINK)[] = [...config.columns];
    if (config.link) {
      const at = config.link.after ? cols.findIndex((c) => c !== LINK && c.key === config.link!.after) : -1;
      cols.splice(at >= 0 ? at + 1 : cols.length, 0, LINK);
    }
    return cols;
  }, [config.columns, config.link]);

  const set = (id: string, key: string, v: string) =>
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [key]: v } }));

  const close = async () => {
    if (
      changed &&
      !(await confirmDialog({ title: "저장하지 않은 수정 내용이 있습니다", message: "닫으면 수정한 내용이 사라집니다.", confirmText: "닫기", danger: true }))
    )
      return;
    onClose();
  };

  const save = () => {
    if (!changed) return onClose();
    const now = nowISO();
    const list = read<Row>(config.collection).slice();
    const linkList = config.link ? read<Row>(config.link.collection).slice() : [];
    let linkN = 0;
    for (const [id, patch] of Object.entries(edits)) {
      const idx = list.findIndex((r) => r.id === id);
      if (idx < 0) continue;
      const next: Row = { ...list[idx], updatedAt: now };
      for (const [k, v] of Object.entries(patch)) {
        if (config.link && k === config.link.key) {
          const li = linkList.findIndex((p) => p.id === next[config.link!.foreignKey]);
          if (li >= 0 && String(linkList[li][config.link.field] ?? "") !== v) {
            linkList[li] = { ...linkList[li], [config.link.field]: v, updatedAt: now };
            linkN++;
          }
          continue;
        }
        const spec = config.columns.find((c) => c.key === k);
        next[k] = spec ? coerceFieldValue(spec, v) : v;
      }
      list[idx] = next;
    }
    write(config.collection, list);
    if (config.link && linkN) write(config.link.collection, linkList);
    toast(`${changed}건을 수정했습니다.` + (linkN ? `\n연결된 기록 ${linkN}건도 함께 수정했습니다.` : ""));
    onClose();
  };

  return (
    <Modal
      open
      onClose={close}
      size="full"
      title={config.title}
      description={
        changed
          ? `${changed}건 수정됨 · '바뀐 내용 저장'을 누르면 반영됩니다`
          : `${initial.length}건 · ${fromSelection ? "선택한 기록" : "지금 목록에 보이는 기록"} · 칸을 고치면 노란색으로 표시됩니다`
      }
      footer={
        <>
          <Button onClick={close}>닫기</Button>
          <Button variant="primary" onClick={save}>
            바뀐 내용 저장
          </Button>
        </>
      }
    >
      <div className="overflow-auto rounded-xl border border-line">
        <table className="min-w-max border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              {order.map((c) => (
                <th key={c === LINK ? "__link" : c.key} className="sticky top-0 z-[2] border-b border-line bg-white px-1.5 py-2 text-left text-[12.5px] font-medium whitespace-nowrap text-sub">
                  {c === LINK ? config.link!.label : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initial.map((row) => {
              const e = edits[row.id];
              const linkedRow = config.link ? linked.find((p) => p.id === row[config.link!.foreignKey]) : undefined;
              return (
                <tr key={row.id} className={cn(e ? "bg-[#fffbeb]" : "bg-white")}>
                  {order.map((c) =>
                    c === LINK ? (
                      <td key="__link" className="border-b border-line-2 p-1 align-top">
                        {linkedRow ? (
                          <FieldControl
                            spec={{ key: config.link!.key, label: config.link!.label, type: "area", width: config.link!.width ?? 250 }}
                            className="bg-[#eef4ff]"
                            value={e?.[config.link!.key] ?? String(linkedRow[config.link!.field] ?? "")}
                            onChange={(v) => set(row.id, config.link!.key, v)}
                          />
                        ) : (
                          <span className="block px-1 py-2 text-xs text-sub" style={{ width: config.link!.width ?? 250 }}>
                            연결된 기록 없음
                          </span>
                        )}
                      </td>
                    ) : (
                      <td key={c.key} className="border-b border-line-2 p-1 align-top">
                        <FieldControl
                          spec={c}
                          value={e?.[c.key] ?? (row[c.key] as string | number | undefined)}
                          onChange={(v) => set(row.id, c.key, v)}
                        />
                      </td>
                    ),
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
