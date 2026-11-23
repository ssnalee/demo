import type { FieldSpec } from "@/components/data";
import { printRecord } from "@/lib/print";
import { WORKPLAN_STATUSES, type Workplan } from "./types";

const statuses = [...WORKPLAN_STATUSES];

/** 일괄 변경 항목 (층·구역·공종은 제외) */
export const WORKPLAN_BULK_FIELDS: FieldSpec[] = [
  { key: "status", label: "계획 상태", type: "opts", options: statuses },
  { key: "__shift", label: "날짜 옮기기 (일)", type: "shift", shiftKeys: ["date"] },
  { key: "date", label: "작업일자", type: "date" },
  { key: "leader", label: "작업책임자", type: "text" },
  { key: "workers", label: "예정 인원", type: "number" },
  { key: "reviewer", label: "검토·승인자", type: "text" },
];

/** 원본 BULK.wp */
export const WORKPLAN_BULK_COLUMNS: FieldSpec[] = [
  { key: "floor", label: "층·구역", type: "floor" },
  { key: "trade", label: "공종", type: "trade" },
  { key: "title", label: "작업명", type: "text", placeholder: "예: 천장 텍스 철거" },
  { key: "workers", label: "인원", type: "number", width: 80 },
  { key: "leader", label: "책임자", type: "text", placeholder: "선택" },
];

/** 작업명을 비우면 "층 공종 작업" */
export const autoWorkTitle = (r: Partial<Record<"title" | "floor" | "trade", string>>) =>
  (r.title ?? "").trim() || `${r.floor} ${r.trade} 작업`;

export function printWorkplan(x: Workplan) {
  printRecord("작업계획서", [
    ["작업일자", x.date],
    ["작업구분", x.type],
    ["층·구역", x.floor],
    ["공종", x.trade],
    ["작업명", x.title],
    ["세부 위치", x.location],
    ["작업책임자", x.leader],
    ["예정 인원", `${x.workers || 0}명`],
    ["작업시간", `${x.start || ""} ~ ${x.end || ""}`],
    ["장비·공구", x.equipment],
    ["자재·반입", x.materials],
    ["작업 범위", x.scope],
    ["작업 순서 및 방법", x.sequence],
    ["위험요인·예상 재해", x.hazards],
    ["안전조치·보호구", x.safety],
    ["비상대응", x.emergency],
    ["계획 상태", x.status],
    ["검토·승인자", x.reviewer],
  ]);
}
