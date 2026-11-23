"use client";

import { Button, Select, toast, confirmDelete, alertDialog, confirmDialog } from "@/components/ui";
import { shiftDate } from "@/lib/date";
import { nowISO } from "@/lib/date";
import type { CollectionKey } from "@/lib/storage/keys";
import { read, write } from "@/lib/storage/store";
import { useState } from "react";
import { FieldControl, isNumericField, type FieldSpec } from "./field-spec";

/** 서버(DB)로 처리하는 화면용: 바꾸기·삭제를 직접 처리 (없으면 로컬 저장소 사용) */
export interface BulkRemote {
  apply: (ids: string[], change: { kind: "shift"; days: number } | { kind: "set"; key: string; value: string | number }) => Promise<string | void>;
  remove: (ids: string[]) => Promise<string | void>;
}

export interface BulkEditConfig<T = Record<string, unknown>> {
  collection: CollectionKey;
  /** 있으면 로컬 저장소 대신 이 함수로 처리 (오류 문구를 반환하면 실패) */
  remote?: BulkRemote;
  /** 예: "근로자", "작업계획서" */
  entityName: string;
  fields: FieldSpec[];
  /** 삭제 불가 사유를 반환하면 삭제를 막음 */
  canDelete?: (ids: string[]) => string | void;
  afterDelete?: (ids: string[]) => void;
  /** 값 변경 후 파생 필드 갱신 */
  after?: (item: T) => void;
}

/**
 * 선택한 행에 같은 값을 한 번에 적용하거나 삭제하는 바.
 * 표 위에 두고, 선택이 있을 때만 보입니다.
 */
export function BulkEditBar<T extends { id: string }>({
  config,
  selected,
  onClear,
  onOpenGrid,
}: {
  config: BulkEditConfig<T>;
  selected: Set<string>;
  onClear: () => void;
  /** 표로 수정 기능이 있는 화면에서 전달 */
  onOpenGrid?: () => void;
}) {
  const [fieldKey, setFieldKey] = useState(config.fields[0]?.key ?? "");
  const spec = config.fields.find((f) => f.key === fieldKey) ?? config.fields[0];
  const [value, setValue] = useState<string>(defaultValue(spec));

  if (!selected.size) return null;

  const apply = async () => {
    if (!spec) return;
    const raw = value;
    if (!["shift", "company", "text"].includes(spec.type) && raw === "") return toast("바꿀 값을 선택해 주세요.", "danger");
    const days = spec.type === "shift" ? Math.round(Number(raw) || 0) : 0;
    if (spec.type === "shift" && !days) return toast("옮길 일수를 입력해 주세요. (예: 3 또는 -2)", "danger");
    const val = isNumericField(spec.type) ? Math.max(0, Number(raw) || 0) : raw.trim();
    const desc =
      spec.type === "shift"
        ? days > 0
          ? `${days}일 뒤로`
          : `${-days}일 앞으로`
        : `'${spec.type === "pct" ? val + "%" : val || "(빈 값)"}'(으)로`;
    if (!(await confirmDialog({ title: `${selected.size}건을 바꿀까요?`, message: `${config.entityName} ${selected.size}건의 '${spec.label}'을(를) ${desc} 바꿉니다.`, confirmText: "바꾸기" }))) return;
    if (config.remote) {
      const err = await config.remote.apply(
        [...selected],
        spec.type === "shift" ? { kind: "shift", days } : { kind: "set", key: spec.key, value: val },
      );
      if (err) return toast(err, "danger");
      return toast(`${selected.size}건을 바꿨습니다.`);
    }
    const now = nowISO();
    const list = read<Record<string, unknown> & { id: string }>(config.collection).map((x) => {
      if (!selected.has(x.id)) return x;
      const next = { ...x };
      if (spec.type === "shift") (spec.shiftKeys ?? []).forEach((k) => (next[k] = shiftDate(String(next[k] ?? ""), days)));
      else next[spec.key] = val;
      config.after?.(next as unknown as T);
      next.updatedAt = now;
      return next;
    });
    write(config.collection, list);
    toast(`${selected.size}건을 바꿨습니다.`);
  };

  const remove = async () => {
    const ids = [...selected];
    const block = config.canDelete?.(ids);
    if (block) return alertDialog({ title: "삭제할 수 없습니다", message: block });
    if (!(await confirmDelete(`${config.entityName} ${ids.length}건을 삭제합니다. 되돌릴 수 없습니다.`, `${ids.length}건을 삭제할까요?`))) return;
    if (config.remote) {
      const err = await config.remote.remove(ids);
      if (err) return toast(err, "danger");
      onClear();
      return toast(`${ids.length}건을 삭제했습니다.`);
    }
    write(
      config.collection,
      read<{ id: string }>(config.collection).filter((x) => !selected.has(x.id)),
    );
    config.afterDelete?.(ids);
    onClear();
    toast(`${ids.length}건을 삭제했습니다.`);
  };

  return (
    <div className="no-print sticky top-[64px] z-10 mb-3 flex animate-rise-in flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-[#bae6fd] bg-white px-3 py-2.5 text-[13px]">
      {/* 선택 건수 */}
      <span className="inline-flex items-center gap-2 pr-1 font-semibold text-fg">
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-brand px-1.5 text-[12px] font-bold text-white tabular-nums">
          {selected.size}
        </span>
        건 선택
      </span>
      <span className="hidden h-5 w-px bg-line sm:block" />

      {/* 일괄 변경: 항목 → 값 → 적용 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-medium text-sub">일괄 변경</span>
        <Select
          compact
          className="h-9 w-auto py-0"
          value={fieldKey}
          options={config.fields.map((f) => ({ value: f.key, label: f.label }))}
          onChange={(e) => {
            setFieldKey(e.target.value);
            setValue(defaultValue(config.fields.find((f) => f.key === e.target.value)));
          }}
        />
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-[#98a2b3]" aria-hidden>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        {spec && (
          // 값 입력칸 높이도 36px로 (FieldControl은 종류별로 select/input)
          <div className="w-44 [&_input]:h-9 [&_input]:py-0 [&_select]:h-9 [&_select]:py-0">
            <FieldControl spec={spec} value={value} onChange={setValue} />
          </div>
        )}
        <Button size="sm" variant="primary" className="h-9 px-4" onClick={apply}>
          적용
        </Button>
        {onOpenGrid && (
          <Button size="sm" className="h-9" onClick={onOpenGrid}>
            표로 수정
          </Button>
        )}
      </div>

      <span className="flex-1" />
      <Button size="sm" variant="danger" className="h-9" onClick={remove}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
        </svg>
        선택 삭제
      </Button>
      <button
        type="button"
        aria-label="선택 해제"
        title="선택 해제"
        onClick={onClear}
        className="grid size-9 cursor-pointer place-items-center rounded-lg text-sub"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

function defaultValue(spec?: FieldSpec): string {
  if (!spec) return "";
  if (spec.type === "shift") return "1";
  if (spec.type === "opts") return spec.options?.[0] ?? "";
  if (spec.type === "pct") return "0";
  return "";
}
