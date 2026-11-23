"use client";

import { Input, Select, Textarea } from "@/components/ui";
import { PCT_OPTIONS } from "@/constants/options";
import { cn } from "@/lib/cn";
import { useGroupedMasters } from "@/lib/storage/masters";

/**
 * 원본의 BE_CFG / GRID_CFG / BULK 설정을 하나로 합친 필드 정의.
 * 일괄수정 바, 표 편집 모달, 여러 건 등록 표가 모두 이 정의를 사용합니다.
 */
export type FieldType =
  | "text"
  | "number"
  | "wage" // 금액(1000원 단위)
  | "pct" // 0~100% 10단위 선택
  | "date"
  | "time"
  | "floor"
  | "trade"
  | "company" // 업체명 자동완성
  | "area" // 여러 줄
  | "opts" // options 중 선택
  | "shift"; // 날짜를 n일 옮기기 (shiftKeys 대상)

export interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  /** type=shift 일 때 옮길 날짜 필드 */
  shiftKeys?: string[];
  placeholder?: string;
  /** 표 편집 시 열 너비(px) */
  width?: number;
}

export const isNumericField = (t: FieldType) => t === "number" || t === "pct" || t === "wage";

/** 입력값(문자열) → 저장값 */
export function coerceFieldValue(spec: FieldSpec, raw: string): string | number {
  return isNumericField(spec.type) ? Math.max(0, Number(raw) || 0) : raw;
}

/** 필드 정의에 맞는 입력 컨트롤 */
export function FieldControl({
  spec,
  value,
  onChange,
  compact = true,
  className,
}: {
  spec: FieldSpec;
  value: string | number | undefined;
  onChange: (v: string) => void;
  compact?: boolean;
  className?: string;
}) {
  const { floorGroups, tradeGroups } = useGroupedMasters();
  const v = value == null ? "" : String(value);
  const style = spec.width ? { width: spec.width } : undefined;
  const common = { compact, className, style, value: v };
  switch (spec.type) {
    case "floor":
      return <Select {...common} groups={floorGroups} onChange={(e) => onChange(e.target.value)} />;
    case "trade":
      return <Select {...common} groups={tradeGroups} onChange={(e) => onChange(e.target.value)} />;
    case "opts":
      return <Select {...common} options={spec.options ?? []} onChange={(e) => onChange(e.target.value)} />;
    case "pct":
      return (
        <Select
          {...common}
          options={PCT_OPTIONS.map((p) => ({ value: String(p), label: `${p}%` }))}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "area":
      return (
        <Textarea
          rows={2}
          className={cn(compact && "min-h-[62px] rounded-lg border-line bg-white px-2.5 py-2 text-[13px]", className)}
          style={style}
          value={v}
          placeholder={spec.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "company":
      return (
        <Input
          {...common}
          list="company-names"
          placeholder={spec.placeholder ?? "업체명"}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
    case "wage":
    case "shift":
      return (
        <Input
          {...common}
          type="number"
          min={spec.type === "shift" ? undefined : 0}
          step={spec.type === "wage" ? 1000 : 1}
          placeholder={spec.placeholder}
          title={spec.type === "shift" ? "+는 뒤로, -는 앞으로" : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "date":
    case "time":
      return <Input {...common} type={spec.type} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <Input {...common} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
}
