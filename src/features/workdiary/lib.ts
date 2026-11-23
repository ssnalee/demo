import type { BulkEditConfig, FieldSpec, GridEditConfig } from "@/components/data";
import { getWorkplans } from "@/features/workplan";
import { printRecord } from "@/lib/print";
import { WORKDIARY_INCIDENTS, type WorkDiary } from "./types";

/** 원본 BE_CFG.workDiaryTable */
export const WORKDIARY_BULK_EDIT: BulkEditConfig<WorkDiary> = {
  collection: "workdiaries",
  entityName: "작업일보",
  fields: [
    { key: "progress", label: "진행률", type: "pct" },
    { key: "actualWorkers", label: "실제 인원", type: "number" },
    { key: "confirmedBy", label: "확인자", type: "text" },
    { key: "incident", label: "사고·아차사고", type: "opts", options: [...WORKDIARY_INCIDENTS] },
    { key: "date", label: "작업일자", type: "date" },
    { key: "floor", label: "층·구역", type: "floor" },
    { key: "trade", label: "공종", type: "trade" },
  ],
};

/** 원본 GRID_CFG.workDiaryTable (__planScope = 연결된 작업계획서의 scope) */
export const WORKDIARY_GRID: GridEditConfig = {
  collection: "workdiaries",
  title: "작업일보 표로 한 번에 수정",
  columns: [
    { key: "date", label: "작업일", type: "date", width: 140 },
    { key: "floor", label: "층·구역", type: "floor", width: 120 },
    { key: "trade", label: "공종", type: "trade", width: 140 },
    { key: "title", label: "작업명", type: "text", width: 180 },
    { key: "actualWorkers", label: "실제 인원", type: "number", width: 80 },
    { key: "progress", label: "진행률", type: "pct", width: 90 },
    { key: "actual", label: "실제 작업내용·완료 실적", type: "area", width: 270 },
    { key: "issues", label: "지연·변경·특이사항", type: "area", width: 220 },
    { key: "safety", label: "안전조치·점검", type: "area", width: 220 },
    { key: "confirmedBy", label: "확인자", type: "text", width: 110 },
  ],
};

/** 원본 BULK.wd */
export const WORKDIARY_BULK_COLUMNS: FieldSpec[] = [
  { key: "floor", label: "층·구역", type: "floor" },
  { key: "trade", label: "공종", type: "trade" },
  { key: "title", label: "작업명", type: "text", placeholder: "예: 천장 텍스 철거" },
  { key: "actualWorkers", label: "실제 인원", type: "number", width: 80 },
  { key: "progress", label: "진행률", type: "pct" },
  { key: "actual", label: "작업내용 (선택)", type: "text", placeholder: "선택" },
];

export function printWorkDiary(x: WorkDiary) {
  const plan = getWorkplans().find((p) => p.id === x.planId);
  printRecord(
    "작업일보",
    [
      ["작업일자", x.date],
      ["층·구역", x.floor],
      ["공종", x.trade],
      ["작업명", x.title],
      ["연결 계획서", plan?.title || "연결 안 함"],
      ["작업책임자", x.leader],
      ["계획 인원", `${x.plannedWorkers || 0}명`],
      ["실제 투입 인원", `${x.actualWorkers || 0}명`],
      ["실제 작업시간", `${x.start || ""} ~ ${x.end || ""}`],
      ["진행률", `${x.progress || 0}%`],
      ["장비·공구", x.equipment],
      ["실제 작업내용·완료실적", x.actual],
      ["지연·변경·특이사항", x.issues],
      ["안전조치·점검", x.safety],
      ["사고·아차사고", x.incident],
      ["확인자", x.confirmedBy],
    ],
    [
      ["작업 전", x.photos?.before],
      ["작업 중", x.photos?.during],
      ["작업 후", x.photos?.after],
    ],
  );
}
