import type { CollectionKey } from "@/lib/storage/keys";

/** 층·구역 / 공종을 기록에서 쓰는 컬렉션 (원본 MASTER_USE_KEYS) */
export const MASTER_USE_KEYS: CollectionKey[] = [
  "risks",
  "actions",
  "inspections",
  "permits",
  "trainings",
  "incidents",
  "workplans",
  "workdiaries",
  "workers",
  "attendance",
  "defects",
  "schedules",
  "estimateExecutions",
];

export type MasterField = "floor" | "trade";

/** 층·공종 필드를 가진 임의의 기록 */
export type MasterRecord = { id: string } & Partial<Record<MasterField, string>> & Record<string, unknown>;

export const masterLabel = (kind: "floor" | "trade") => (kind === "floor" ? "층·구역" : "공종");
