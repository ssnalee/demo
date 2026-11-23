export const WORKPLAN_TYPES = ["일일 작업", "주간 작업", "공정 변경 작업", "긴급·수시 작업"] as const;
export const WORKPLAN_STATUSES = ["작성중", "검토요청", "승인", "작업완료", "보류"] as const;
/** 여러 건 등록에서 고를 수 있는 상태 */
export const WORKPLAN_BULK_STATUSES = ["작성중", "검토요청", "승인"] as const;

/** 작업계획서 (DB workplans ↔ 서버 액션 WorkplanDTO 와 같은 모양) */
export type { WorkplanDTO as Workplan } from "@/server/actions/workplans";

/** 승인·작업완료는 초록색 */
export const isWorkplanDone = (status: string) => status === "승인" || status === "작업완료";
