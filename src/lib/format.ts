export const won = (n: number | string | undefined | null) =>
  (Number(n) || 0).toLocaleString("ko-KR") + "원";

export const num = (n: number | string | undefined | null) => (Number(n) || 0).toLocaleString("ko-KR");

export const pct = (n: number, digits = 1) => `${(Number.isFinite(n) ? n : 0).toFixed(digits)}%`;

export function fmtBytes(n: number): string {
  return n > 1048576 ? (n / 1048576).toFixed(2) + "MB" : Math.max(1, Math.round(n / 1024)) + "KB";
}

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
