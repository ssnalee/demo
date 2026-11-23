export const SCHEDULE_CATEGORIES = ["공사일정", "안전관리", "행정업무", "점검·검사", "회의", "자재·장비", "기타"] as const;
export const SCHEDULE_PRIORITIES = ["일반", "중요", "긴급"] as const;
export const SCHEDULE_STATUSES = ["예정", "진행 중", "완료", "연기"] as const;

/** 저장 키: schedules */
export interface Schedule {
  id: string;
  title: string;
  category: string;
  start: string;
  end: string;
  /** 시작 시간 HH:MM */
  time: string;
  endTime: string;
  priority: string;
  status: string;
  owner: string;
  company: string;
  floor: string;
  location: string;
  content: string;
  result: string;
  updatedAt?: string;
}
