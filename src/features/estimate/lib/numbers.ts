/** 셀 값을 숫자로 ("1,234원" → 1234). 숫자가 아니면 NaN */
export function estNum(v: unknown): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/[,\s원₩]/g, "");
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}
