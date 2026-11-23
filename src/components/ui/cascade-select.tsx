"use client";

import { cn } from "@/lib/cn";
import type { OptionGroup } from "@/lib/storage/masters";
import { useState, type ChangeEvent, type ComponentProps } from "react";

type Props = Omit<ComponentProps<"select">, "value" | "onChange"> & {
  groups: OptionGroup[];
  value?: string | number | readonly string[];
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  /** 맨 앞 빈 선택지 (예: "전체 공종", "선택 안 함") → 분류 쪽에 표시 */
  placeholder?: string;
  /** 각 select에 적용할 클래스 */
  controlClassName: string;
};

/** 바깥 onChange는 e.target.value만 읽으므로, 분류를 바꿀 때 값만 담은 이벤트로 알림 */
const valueEvent = (value: string) => ({ target: { value }, currentTarget: { value } }) as ChangeEvent<HTMLSelectElement>;

/**
 * 2단 선택: 왼쪽 분류(지하층 / 가설공사 …) → 오른쪽 그 분류의 항목.
 * 긴 묶음 목록을 한 번에 펼치지 않도록 Select(groups)에서 사용.
 */
export function CascadeSelect({ groups, value, onChange, placeholder, controlClassName, className, style, ...rest }: Props) {
  const v = value == null ? "" : String(value);
  const [picked, setPicked] = useState<string | null>(null);
  const owner = groups.find((g) => g.options.includes(v))?.label;
  const groupLabel = owner ?? picked ?? (placeholder !== undefined ? "" : (groups[0]?.label ?? ""));
  const group = groups.find((g) => g.label === groupLabel);
  // 목록에 없는 기존 값(예: 예전에 지운 공종)도 보이게
  const items = group ? (v && !owner && v !== "" ? [v, ...group.options] : group.options) : [];

  return (
    <div className={cn("grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2", className)} style={style}>
      <select
        aria-label="분류"
        className={cn(controlClassName, "cursor-pointer")}
        value={groupLabel}
        disabled={rest.disabled}
        onChange={(e) => {
          const label = e.target.value;
          setPicked(label);
          // 분류를 바꾸면 그 분류의 첫 항목으로 (빈 분류 = 선택 안 함 / 전체)
          onChange?.(valueEvent(groups.find((g) => g.label === label)?.options[0] ?? ""));
        }}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {groups.map((g) => (
          <option key={g.label} value={g.label}>
            {g.label}
          </option>
        ))}
      </select>
      <select
        {...rest}
        className={cn(controlClassName, "cursor-pointer")}
        value={group ? v : ""}
        disabled={rest.disabled || !group}
        onChange={onChange}
      >
        {!group && <option value="">{placeholder ? "—" : "분류를 먼저 선택"}</option>}
        {items.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

const BASEMENT = "지하";
const ABOVE = "지상";
/** "지하 3층" → 지하 3, "12층" → 지상 12 */
function parseFloor(v: string): { mode: string; n: number } | null {
  const b = /^지하\s*(\d+)\s*층$/.exec(v);
  if (b) return { mode: BASEMENT, n: Number(b[1]) };
  const a = /^(\d+)\s*층$/.exec(v);
  if (a) return { mode: ABOVE, n: Number(a[1]) };
  return null;
}
const formatFloor = (mode: string, n: number) => (mode === BASEMENT ? `지하 ${n}층` : `${n}층`);
/** 숫자 층(지하 N층 · N층)만 들어 있는 묶음은 지하/지상 숫자 입력으로 대신함 */
const isNumericGroup = (g: OptionGroup) => g.options.length > 0 && g.options.every((o) => parseFloor(o));

/**
 * 층·구역 선택: 왼쪽 지하 / 지상 / 기타 구역… → 지하·지상은 오른쪽에 층수(숫자) 입력, 그 외는 항목 선택.
 * Select(groups)에서 층 묶음(kind: "floor")일 때 사용.
 */
export function FloorSelect({ groups, value, onChange, placeholder, controlClassName, className, style, ...rest }: Props) {
  const v = value == null ? "" : String(value);
  const [picked, setPicked] = useState<string | null>(null);
  // 입력 중인 숫자 (비워 둔 순간에도 칸이 다른 값으로 튀지 않게, 숫자일 때만 값 반영)
  const [text, setText] = useState<string | null>(null);
  const others = groups.filter((g) => !isNumericGroup(g));
  const parsed = parseFloor(v);
  const owner = parsed?.mode ?? others.find((g) => g.options.includes(v))?.label;
  const mode = owner ?? picked ?? (placeholder !== undefined ? "" : ABOVE);
  const group = others.find((g) => g.label === mode);
  const numeric = mode === BASEMENT || mode === ABOVE;

  return (
    <div className={cn("grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2", className)} style={style}>
      <select
        aria-label="구분"
        className={cn(controlClassName, "cursor-pointer")}
        value={mode}
        disabled={rest.disabled}
        onChange={(e) => {
          const m = e.target.value;
          setPicked(m);
          setText(null);
          if (m === BASEMENT || m === ABOVE) onChange?.(valueEvent(formatFloor(m, parsed?.n ?? 1)));
          else onChange?.(valueEvent(others.find((g) => g.label === m)?.options[0] ?? ""));
        }}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        <option value={BASEMENT}>지하</option>
        <option value={ABOVE}>지상</option>
        {others.map((g) => (
          <option key={g.label} value={g.label}>
            {g.label}
          </option>
        ))}
      </select>
      {numeric ? (
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={mode === BASEMENT ? 20 : 200}
            step={1}
            required={rest.required}
            disabled={rest.disabled}
            name={rest.name}
            aria-label={mode === BASEMENT ? "지하 층수" : "지상 층수"}
            placeholder="층수"
            className={cn(controlClassName, "pr-9")}
            value={text ?? (parsed?.mode === mode ? parsed.n : "")}
            onChange={(e) => {
              setText(e.target.value);
              const n = parseInt(e.target.value, 10);
              if (n > 0) onChange?.(valueEvent(formatFloor(mode, n)));
            }}
            onBlur={() => setText(null)}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3.5 grid place-items-center text-sm text-sub">층</span>
        </div>
      ) : (
        <select
          {...rest}
          className={cn(controlClassName, "cursor-pointer")}
          value={group ? v : ""}
          disabled={rest.disabled || !group}
          onChange={onChange}
        >
          {!group && <option value="">{placeholder ? "—" : "구분을 먼저 선택"}</option>}
          {group && !group.options.includes(v) && v && <option value={v}>{v}</option>}
          {group?.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
