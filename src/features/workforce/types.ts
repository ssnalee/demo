export const WORKER_STATUSES = ["재직", "퇴사·출역종료"] as const;
export const WORKER_INACTIVE = "퇴사·출역종료";

/** 일일 출역 등록 폼의 상태 순서 */
export const ATTENDANCE_STATUSES = ["출역", "결근", "조퇴", "외출"] as const;
/** 출역 한 번에 등록·일괄수정의 상태 순서 */
export const ATTENDANCE_STATUSES_BULK = ["출역", "조퇴", "외출", "결근"] as const;

export const WORKER_DOC_KINDS = [
  { key: "idcard", label: "신분증 (주민등록증·면허증)", short: "신분증" },
  { key: "bank", label: "통장사본", short: "통장" },
] as const;
export type WorkerDocKind = (typeof WORKER_DOC_KINDS)[number]["key"];

/** 저장 키: workers */
export interface Worker {
  id: string;
  name: string;
  company: string;
  trade: string;
  phone: string;
  dailyWage: number;
  status: string;
  /** 서류 사진 유무 (사진 자체는 IndexedDB `worker:<id>:idcard|bank`) */
  docs?: Partial<Record<WorkerDocKind, boolean>>;
  updatedAt?: string;
}

/** 저장 키: attendance */
export interface Attendance {
  id: string;
  date: string;
  workerId: string;
  workerName: string;
  company?: string;
  /** 출역 등록 시점의 1일 노임 (예전 기록에는 없을 수 있음) */
  dailyWage?: number | string | null;
  floor: string;
  trade: string;
  inTime: string;
  outTime: string;
  status: string;
  updatedAt?: string;
}

/** IndexedDB에 저장되는 서류 파일 */
export interface WorkerDocFile {
  data: string;
  name: string;
  at: string;
}

export const workerDocKey = (workerId: string, kind: WorkerDocKind) => `worker:${workerId}:${kind}`;
