export const DEFECT_TYPES = [
  "누수·방수",
  "균열·파손",
  "마감 불량",
  "전기·조명",
  "설비·배관",
  "창호·문",
  "소방·안전설비",
  "작동 불량",
  "기타",
] as const;
export const DEFECT_STATUSES = ["접수", "보수예정", "보수중", "완료", "재발"] as const;

/** 저장 키: defects */
export interface Defect {
  id: string;
  /** 접수일 */
  date: string;
  floor: string;
  trade: string;
  location: string;
  type: string;
  company: string;
  contact: string;
  planDate: string;
  doneDate: string;
  status: string;
  content: string;
  action: string;
  note: string;
  /** 하자 발생 / 보수 완료 사진 (dataURL) */
  photos?: { before?: string; after?: string };
  updatedAt?: string;
}

/** 대시보드 카드용 집계 (원본 renderDefects) */
export function defectCounts(list: Defect[]) {
  return {
    total: list.length,
    pending: list.filter((x) => x.status === "접수" || x.status === "보수예정").length,
    progress: list.filter((x) => x.status === "보수중").length,
    done: list.filter((x) => x.status === "완료").length,
  };
}
