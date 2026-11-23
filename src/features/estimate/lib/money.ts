/** 금액 표시 (원본 moneyKRW) */
export const moneyKRW = (v: number | string | undefined | null) => (Number(v) || 0).toLocaleString("ko-KR") + "원";

/** 부호를 붙인 금액 표시 (-1,000원) */
export const signedKRW = (v: number) => (v < 0 ? "-" : "") + moneyKRW(Math.abs(v));

/** "2억2천", "3500만", "220,000,000원" 같은 한글 금액을 숫자로. 알아볼 수 없으면 NaN */
export function parseMoneyKR(input: unknown): number {
  const s = String(input ?? "").replace(/[,\s원₩]/g, "");
  if (!s) return NaN;
  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(+s);
  const UNIT: Record<string, number> = { 천: 1000, 백: 100, 십: 10 };
  const small = (t: string) => {
    let v = 0,
      last = 0,
      m: RegExpExecArray | null;
    const re = /(\d+(?:\.\d+)?)?(천|백|십)/g;
    while ((m = re.exec(t))) {
      v += (m[1] ? parseFloat(m[1]) : 1) * UNIT[m[2]];
      last = re.lastIndex;
    }
    const tail = t.slice(last);
    if (tail) {
      if (!/^\d+(\.\d+)?$/.test(tail)) return NaN;
      v += +tail;
    }
    return v;
  };
  let total = 0,
    rest = s;
  const e = s.split("억");
  if (e.length > 2) return NaN;
  if (e.length === 2) {
    if (e[0] && !/^\d+(\.\d+)?$/.test(e[0])) return NaN;
    total += (parseFloat(e[0]) || 1) * 1e8;
    rest = e[1];
  }
  if (rest.includes("만")) {
    const [x, y] = rest.split("만");
    total += (x ? small(x) : 1) * 1e4 + (y ? Number(y) : 0);
  } else if (/[천백십]/.test(rest)) total += small(rest) * 1e4;
  else if (rest) total += Number(rest);
  return Number.isFinite(total) ? Math.round(total) : NaN;
}

export interface VatParts {
  supply: number;
  vat: number;
  total: number;
}

/** 금액을 공급가액·부가세·합계로 나눔. mode=incl이면 amount가 부가세 포함 금액 */
export function vatSplit(amount: number, mode: "incl" | "excl", rate: number | string): VatParts {
  const r = (Number(rate) || 0) / 100,
    a = Math.max(0, Number(amount) || 0);
  if (mode === "incl") {
    const supply = Math.round(a / (1 + r));
    return { supply, vat: a - supply, total: a };
  }
  const vat = Math.round(a * r);
  return { supply: a, vat, total: a + vat };
}
