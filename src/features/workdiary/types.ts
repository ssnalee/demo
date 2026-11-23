export const WORKDIARY_INCIDENTS = ["없음", "아차사고 발생", "사고 발생", "별도 보고서 등록"] as const;

export const PHOTO_STAGES = [
  ["before", "작업 전"],
  ["during", "작업 중"],
  ["after", "작업 후"],
] as const;
export type PhotoStage = (typeof PHOTO_STAGES)[number][0];

export interface WorkDiaryPhotos {
  before: string;
  during: string;
  after: string;
}

export const emptyPhotos = (): WorkDiaryPhotos => ({ before: "", during: "", after: "" });

/** 저장 키: workdiaries (필드명은 원본과 동일). planId는 workplans의 id */
export interface WorkDiary {
  id: string;
  planId: string;
  date: string;
  floor: string;
  trade: string;
  title: string;
  leader: string;
  plannedWorkers: number;
  actualWorkers: number;
  start: string;
  end: string;
  progress: number;
  equipment: string;
  actual: string;
  issues: string;
  safety: string;
  incident: string;
  confirmedBy: string;
  photos: WorkDiaryPhotos;
  updatedAt?: string;
}
