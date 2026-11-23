import { DAY_MS, dUTC, today } from "@/lib/date";
import type { Process, ProcessStatus } from "./types";

export interface ProcessStats {
  /** 기간(일) */
  dur: number;
  /** 오늘 기준 계획 진행률(%) */
  planned: number;
  /** 실제 진행률(%) */
  p: number;
  st: ProcessStatus;
}

/** 공정 1건의 기간·계획/실제 진행률·상태 */
export function processStats(x: Pick<Process, "start" | "end" | "progress">, todayStr = today()): ProcessStats {
  const s = dUTC(x.start || "");
  const e = dUTC(x.end || "");
  const t = dUTC(todayStr);
  const dur = Math.max(1, Math.round((e - s) / DAY_MS) + 1);
  const planned = Math.max(0, Math.min(100, ((Math.round((t - s) / DAY_MS) + 1) / dur) * 100));
  const p = Math.max(0, Math.min(100, Number(x.progress) || 0));
  let st: ProcessStatus = "예정";
  if (p >= 100) st = "완료";
  else if (t > e) st = "지연";
  else if (t >= s) st = p < planned - 15 ? "지연 우려" : "진행 중";
  return { dur, planned, p, st };
}

export interface ProcessSummary {
  /** 기간 가중 실제 공정률(%) */
  overall: number;
  /** 기간 가중 계획 공정률(%) */
  planned: number;
  /** 진행 중 + 지연 우려 건수 */
  active: number;
  delayed: number;
}

/** 전체 공정률 요약 (대시보드·보고서용) */
export function processSummary(list: Process[], todayStr = today()): ProcessSummary {
  let w = 0;
  let act = 0;
  let pl = 0;
  let active = 0;
  let delayed = 0;
  list.forEach((x) => {
    const k = processStats(x, todayStr);
    w += k.dur;
    act += k.p * k.dur;
    pl += k.planned * k.dur;
    if (k.st === "진행 중" || k.st === "지연 우려") active++;
    if (k.st === "지연") delayed++;
  });
  return { overall: w ? act / w : 0, planned: w ? pl / w : 0, active, delayed };
}

/** 공정명 = 층 + 공종 + 작업 단계 */
export const processTitle = (x: Pick<Process, "floor" | "trade" | "stage">) =>
  [x.floor, x.trade, x.stage].filter(Boolean).join(" ");

export const statusTone = (st: ProcessStatus) =>
  st === "완료" || st === "진행 중" ? "success" : st === "지연" ? "danger" : "warning";

export const sortByStart = (list: Process[]) =>
  list.slice().sort((x, y) => (x.start || "").localeCompare(y.start || ""));
