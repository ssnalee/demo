export const DAY_MS = 86_400_000;

/** 로컬 시간대 기준 YYYY-MM-DD */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const today = () => localDateString(new Date());
export const monthStart = () => today().slice(0, 7) + "-01";

/** YYYY-MM-DD → UTC 자정 타임스탬프 (날짜 계산용) */
export function dUTC(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

/** 날짜 문자열을 n일 이동 */
export function shiftDate(date: string, days: number): string {
  if (!date) return date;
  return new Date(dUTC(date) + days * DAY_MS).toISOString().slice(0, 10);
}

/** a → b 일수 차이 (b - a) */
export function daysBetween(a: string, b: string): number {
  return Math.round((dUTC(b) - dUTC(a)) / DAY_MS);
}

/** start~until 날짜 목록 (최대 limit개) */
export function dateRange(start: string, until: string, opts: { skipSunday?: boolean; limit?: number } = {}): string[] {
  const out: string[] = [];
  if (!start) return out;
  const end = until || start;
  for (let t = dUTC(start); t <= dUTC(end) && out.length < (opts.limit ?? 62); t += DAY_MS) {
    const d = new Date(t);
    if (opts.skipSunday && d.getUTCDay() === 0) continue;
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export const nowISO = () => new Date().toISOString();

/** 화면 표시용 날짜: "2026-11-28" → "2026.11.28" */
export const dotDate = (date: string) => (date ? date.replaceAll("-", ".") : "");
