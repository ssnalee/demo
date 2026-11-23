export const RISK_TYPES = ["작업 전", "최초", "정기", "수시"] as const;
export const RISK_CATEGORIES = [
  "붕괴·구조체 손상",
  "추락·낙하",
  "화재·폭발",
  "감전",
  "분진·유해가스",
  "협착·충돌",
  "근골격계 부담",
  "기타",
] as const;
export const RISK_STATUSES = ["조치대기", "조치중", "작업중지·관리자 확인 필요"] as const;
export const LIKELIHOOD_OPTIONS = [
  { value: "1", label: "1 - 매우 낮음" },
  { value: "2", label: "2 - 낮음" },
  { value: "3", label: "3 - 보통" },
  { value: "4", label: "4 - 높음" },
  { value: "5", label: "5 - 매우 높음" },
];
export const SEVERITY_OPTIONS = [
  { value: "1", label: "1 - 경미" },
  { value: "2", label: "2 - 낮음" },
  { value: "3", label: "3 - 보통" },
  { value: "4", label: "4 - 중대" },
  { value: "5", label: "5 - 치명적" },
];

/** 저장 키: risks */
export interface Risk {
  id: string;
  date: string;
  type: string;
  floor: string;
  trade: string;
  category: string;
  owner: string;
  hazard: string;
  existing: string;
  likelihood: number;
  severity: number;
  /** likelihood × severity */
  score: number;
  control: string;
  due: string;
  status: string;
  /** 위험 현장 사진 (dataURL) */
  beforePhoto: string;
  /** 개선 완료 사진 (dataURL) */
  afterPhoto: string;
}
