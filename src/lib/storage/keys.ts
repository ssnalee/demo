/**
 * 현장별 저장 키. 원본(V18.2.3)과 같은 키를 그대로 씁니다.
 * 백엔드를 붙일 때는 이 키가 곧 API 리소스 이름이 됩니다.
 */
export const COLLECTION_KEYS = [
  "risks",
  "actions",
  "inspections",
  "permits",
  "trainings",
  "incidents",
  "workers",
  "attendance",
  "workplans",
  "workdiaries",
  "estimateExecutions",
  "processes",
  "defects",
  "schedules",
  "siteInfo",
  "estSettings",
  "masterFloors",
  "masterTrades",
  "masterCompanies",
] as const;

export type CollectionKey = (typeof COLLECTION_KEYS)[number];
