import type { Action } from "@/features/actions";
import type { Attendance, Worker } from "@/features/workforce";
import { WORKER_INACTIVE } from "@/features/workforce";
import type { Risk } from "@/features/risk";

export const isActionOpen = (a: Action) => a.status !== "확인완료";

/** 금일 출역('출역' 상태) 인원을 공종별로 집계, 많은 순 */
export function todayTradeCounts(attendance: Attendance[], date: string): [trade: string, count: number][] {
  const counts: Record<string, number> = {};
  attendance
    .filter((x) => x.date === date && x.status === "출역")
    .forEach((x) => {
      const t = (x.trade || "").trim() || "공종 미지정";
      counts[t] = (counts[t] || 0) + 1;
    });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export const activeWorkerCount = (workers: Worker[]) => workers.filter((x) => x.status !== WORKER_INACTIVE).length;

/** 층별 위험요인 수 / 미완료 개선조치 수 */
export function floorRiskSummary(floors: string[], risks: Risk[], actions: Action[]) {
  return floors.map((floor) => ({
    id: floor,
    floor,
    risks: risks.filter((x) => x.floor === floor).length,
    openActions: actions.filter((x) => x.floor === floor && isActionOpen(x)).length,
  }));
}
