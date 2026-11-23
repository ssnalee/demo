export const TRAINING_TYPES = ["정기교육", "채용 시 교육", "작업내용 변경 시 교육", "특별교육", "작업 전 안전회의"] as const;

/** 저장 키: trainings */
export interface Training {
  id: string;
  type: string;
  /** datetime-local (YYYY-MM-DDTHH:mm) */
  date: string;
  title: string;
  instructor: string;
  content: string;
  count: number;
  attendees: string[];
  attendanceChecked: boolean;
}

/** 참석자 명단 문자열 → 배열 (쉼표·전각쉼표·줄바꿈 구분) */
export const parseAttendees = (text: string) =>
  text
    .split(/[，,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
