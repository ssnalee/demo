export const INCIDENT_TYPES = ["아차사고", "산업재해", "화재", "설비사고", "기타"] as const;

/** 저장 키: incidents */
export interface Incident {
  id: string;
  type: string;
  /** datetime-local (YYYY-MM-DDTHH:mm) */
  date: string;
  floor: string;
  reporter: string;
  narrative: string;
  action: string;
}
