import type { BadgeTone } from "@/components/ui";
import { daysBetween, today } from "@/lib/date";
import type { Schedule } from "./types";

export const scheduleOpen = (x: Schedule) => x.status !== "완료";

/** 시작일까지 남은 일수 (오늘=0, 지난 일정은 음수, 시작일 없으면 NaN) */
export function scheduleDaysLeft(x: Schedule, todayStr = today()): number {
  return x.start ? daysBetween(todayStr, x.start) : NaN;
}

const endOf = (x: Schedule) => x.end || x.start;
/** date가 일정 기간 안에 있는지 */
export const scheduleOn = (x: Schedule, date: string) => x.start <= date && endOf(x) >= date;
export const isImportant = (x: Schedule) => x.priority === "긴급" || x.priority === "중요";
/** 중요·긴급이고 3일 이내 시작 */
const isSoonImportant = (x: Schedule, t: string) => {
  const d = scheduleDaysLeft(x, t);
  return isImportant(x) && d >= 0 && d <= 3;
};

export const scheduleRange = (x: Schedule) => (x.end && x.end !== x.start ? `${x.start} ~ ${x.end}` : x.start);

export const priorityTone = (p: string): BadgeTone => (p === "긴급" ? "danger" : p === "중요" ? "warning" : "success");

export const sortByStart = (list: Schedule[]) =>
  list.slice().sort((a, b) => (a.start || "").localeCompare(b.start || ""));

export interface ScheduleSummary {
  /** 오늘 진행되는 미완료 일정 */
  today: Schedule[];
  /** 3일 이내 시작하는 중요·긴급 미완료 일정 */
  urgent: Schedule[];
  /** 기한(종료일) 지난 미완료 일정 */
  overdue: Schedule[];
  /** 미완료 전체 */
  open: Schedule[];
  /** 중요·긴급 미완료 */
  important: Schedule[];
  done: Schedule[];
  /** 다가오는 미완료 일정 (시작일 순 6건) */
  upcoming: Schedule[];
}

/** 일정 요약 (대시보드·일정관리 화면 공통) */
export function scheduleSummary(all: Schedule[], todayStr = today()): ScheduleSummary {
  const open = all.filter(scheduleOpen);
  return {
    today: open.filter((x) => scheduleOn(x, todayStr)),
    urgent: open.filter((x) => isSoonImportant(x, todayStr)),
    overdue: open.filter((x) => endOf(x) < todayStr),
    open,
    important: open.filter(isImportant),
    done: all.filter((x) => x.status === "완료"),
    upcoming: sortByStart(open).slice(0, 6),
  };
}

/** 앱 시작 알림 대상: 오늘·기한 초과·임박 중요일정 */
export function scheduleAlertItems(all: Schedule[], todayStr = today()) {
  const relevant = sortByStart(
    all.filter(
      (x) => scheduleOpen(x) && (scheduleOn(x, todayStr) || endOf(x) < todayStr || isSoonImportant(x, todayStr)),
    ),
  );
  const overdue = relevant.filter((x) => endOf(x) < todayStr);
  const due = relevant.filter((x) => scheduleOn(x, todayStr));
  const soon = relevant.filter((x) => !overdue.includes(x) && !due.includes(x));
  return { relevant, overdue, due, soon };
}
