/** 현장 관리 관련 타입과 선택지 */
export type { SiteInfo } from "@/lib/storage/site-info";
export type { SiteDTO } from "@/server/actions/sites";

/** 공사 종류 선택지 (현장 정보·새 현장) */
export const SITE_TYPES = [
  "리모델링·대수선",
  "실내 인테리어",
  "신축",
  "증축",
  "보수·보강",
  "철거·해체",
  "설비·전기 공사",
  "기타",
] as const;
