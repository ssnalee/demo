export const ACTION_STATUSES = ["조치대기", "조치중", "완료요청", "확인완료"] as const;

/** 저장 키: actions (위험성평가 저장 시 자동 생성) */
export interface Action {
  id: string;
  /** 연결된 위험성평가 id */
  riskId?: string;
  title: string;
  floor: string;
  owner: string;
  due: string;
  /** 긴급 / 높음 / 보통 */
  priority?: string;
  control: string;
  status: string;
  /** 조치 증빙사진 (dataURL) */
  evidence?: string;
  evidenceName?: string;
  verifier?: string;
  verifiedAt?: string;
}
