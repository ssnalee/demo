/**
 * 출역·노임 계산 (순수 함수). 대시보드·보고서에서도 사용합니다.
 */
import type { Attendance, Worker } from "./types";

/** 출근~퇴근 기록 시간(시간 단위). 자정을 넘기면 다음 날로 계산 */
export function attendanceHours(x: Pick<Attendance, "inTime" | "outTime">): number {
  if (!x.inTime || !x.outTime) return 0;
  const a = x.inTime.split(":").map(Number);
  const b = x.outTime.split(":").map(Number);
  let mins = b[0] * 60 + b[1] - (a[0] * 60 + a[1]);
  if (mins < 0) mins += 1440;
  return mins / 60;
}

/** 노임 적용 일수: 출역 1, 조퇴·외출 0.5, 결근 0 */
export function attendanceWageFactor(status: string | undefined): number {
  if (status === "출역") return 1;
  if (status === "조퇴" || status === "외출") return 0.5;
  return 0;
}

/** 출역 기록의 1일 노임. 기록에 없으면 현재 근로자 등록 노임 */
export function attendanceDailyWage(x: Attendance, workers: Pick<Worker, "id" | "dailyWage">[]): number {
  if (x.dailyWage !== undefined && x.dailyWage !== null && x.dailyWage !== "") return Math.max(0, Number(x.dailyWage) || 0);
  const w = workers.find((v) => v.id === x.workerId);
  return Math.max(0, Number(w?.dailyWage) || 0);
}

/** 당일 노무비 */
export function attendancePay(x: Attendance, workers: Pick<Worker, "id" | "dailyWage">[]): number {
  return Math.round(attendanceDailyWage(x, workers) * attendanceWageFactor(x.status));
}

export interface AttendanceFilter {
  start?: string;
  end?: string;
  workerId?: string;
  company?: string;
}

/** 기간·근로자·업체로 거른 출역 기록 (날짜, 이름 순) */
export function filterAttendance(list: Attendance[], f: AttendanceFilter): Attendance[] {
  const start = f.start || "0000-01-01";
  const end = f.end || "9999-12-31";
  return list
    .filter(
      (x) =>
        x.date >= start &&
        x.date <= end &&
        (!f.workerId || x.workerId === f.workerId) &&
        (!f.company || (x.company || "") === f.company),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.workerName).localeCompare(String(b.workerName), "ko"));
}

export interface PersonalAttendanceSummary {
  key: string;
  name: string;
  company: string;
  present: number;
  absent: number;
  early: number;
  out: number;
  paidDays: number;
  hours: number;
  pay: number;
}

/** 개인별 출역 집계 */
export function summarizeAttendance(rows: Attendance[], workers: Pick<Worker, "id" | "dailyWage">[]): PersonalAttendanceSummary[] {
  const groups = new Map<string, PersonalAttendanceSummary>();
  rows.forEach((x) => {
    const key = x.workerId || x.workerName;
    let g = groups.get(key);
    if (!g) {
      g = { key, name: x.workerName || "이름 미상", company: x.company || "", present: 0, absent: 0, early: 0, out: 0, paidDays: 0, hours: 0, pay: 0 };
      groups.set(key, g);
    }
    if (x.status === "출역") g.present++;
    else if (x.status === "결근") g.absent++;
    else if (x.status === "조퇴") g.early++;
    else if (x.status === "외출") g.out++;
    g.paidDays += attendanceWageFactor(x.status);
    g.hours += attendanceHours(x);
    g.pay += attendancePay(x, workers);
  });
  return [...groups.values()];
}

/** 특정 날짜의 출역 인원 (결근 제외) */
export function attendanceCountOn(list: Attendance[], date: string): number {
  return list.filter((x) => x.date === date && x.status !== "결근").length;
}

export interface PastedWorker {
  name: string;
  company: string;
  trade: string;
  phone: string;
  dailyWage: string;
}

/**
 * 엑셀·카톡에서 복사한 명단 파싱. 한 줄에 한 명, 칸 순서는 상관없음.
 * 연락처·노임(25만 / 250000)·공종(현장 공종 목록에 있는 값)을 알아보고, 남은 첫 칸이 성명, 나머지가 업체.
 */
export function parseWorkerPaste(text: string, trades: string[]): PastedWorker[] {
  const out: PastedWorker[] = [];
  text
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^\d+[.)]\s*/, ""))
    .filter(Boolean)
    .forEach((line) => {
      let toks = line
        .split(/\t|,|\s{2,}|\s*\/\s*/)
        .map((x) => x.trim())
        .filter(Boolean);
      if (toks.length < 2 && !/[\t,/]/.test(line)) toks = line.split(/\s+/);
      const r: PastedWorker = { name: "", company: "", trade: "", phone: "", dailyWage: "" };
      const rest: string[] = [];
      toks.forEach((t) => {
        const c = t.replace(/[,원\s]/g, "");
        if (!r.phone && /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(c)) r.phone = t;
        else if (!r.dailyWage && /^\d+(\.\d+)?만$/.test(c)) r.dailyWage = String(Math.round(parseFloat(c) * 10000));
        else if (!r.dailyWage && /^\d{5,7}$/.test(c)) r.dailyWage = c;
        else if (!r.trade && trades.includes(t)) r.trade = t;
        else rest.push(t);
      });
      if (/^(성명|이름|번호|no)$/i.test(rest[0] || "")) return;
      r.name = rest.shift() || "";
      r.company = rest.join(" ");
      if (r.name) out.push(r);
    });
  return out;
}

/** 근로자 중복 판단 키 (같은 이름·같은 업체) */
export const workerDupKey = (x: { name?: string; company?: string }) => (x.name || "").trim() + "|" + (x.company || "").trim();
