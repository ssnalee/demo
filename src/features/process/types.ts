export const PROCESS_STAGES = [
  "준비·자재반입",
  "철거",
  "먹매김",
  "설치",
  "1차 시공",
  "2차 시공",
  "마감",
  "검측·확인",
  "보수·정리",
] as const;

export type ProcessStatus = "예정" | "진행 중" | "지연 우려" | "지연" | "완료";

/** 공정 (DB processes ↔ 서버 액션 ProcessDTO 와 같은 모양) */
export type { ProcessDTO as Process } from "@/server/actions/processes";
