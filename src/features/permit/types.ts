export const PERMIT_TYPES = ["화기", "고소", "밀폐공간", "정전·전기", "중량물", "굴착", "기타"] as const;
/** 신청 → 승인 / 반려 */
export const PERMIT_STATUSES = ["신청", "승인", "반려"] as const;

/** 저장 키: permits */
export interface Permit {
  id: string;
  type: string;
  floor: string;
  /** datetime-local (YYYY-MM-DDTHH:mm) */
  start: string;
  end: string;
  note: string;
  applicant: string;
  status: string;
  reviewer?: string;
  reviewedAt?: string;
}
