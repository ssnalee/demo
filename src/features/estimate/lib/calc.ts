import { EST_MANUAL_FILE, type EstimateItem, type EstimateSource, type EstSettings } from "../types";

/** 가장 낮은 금액의 출처 */
const cheapest = (src: EstimateSource[]) => src.reduce((m, y) => (y.amount < m.amount ? y : m));

/** 항목의 실행금액: 비교견적이 있으면 선택(pick)에 따라 계산 */
export function estCostOf(x: Partial<EstimateItem>): number {
  const all = x.sources || [];
  if (!all.length) return Number(x.cost) || 0;
  if (x.pick === "manual") return Number(x.manualCost) || 0;
  const src = all.filter((y) => !y.off);
  if (!src.length) return 0;
  if (x.pick === "sum") return src.reduce((t, y) => t + y.amount, 0);
  return (src.find((y) => y.id === x.pick) || cheapest(src)).amount;
}

/** 현재 선택된 비교견적 출처 id (select 값) */
export function estPickValue(x: EstimateItem): string {
  const src = (x.sources || []).filter((y) => !y.off);
  if (x.pick === "manual") return "manual";
  if (x.pick === "sum") return "sum";
  if (!src.length) return "";
  return (src.find((y) => y.id === x.pick) || cheapest(src)).id;
}

/** CSV용 '실행 견적 출처' 문구 */
export function estUsedLabel(x: EstimateItem): string {
  const src = x.sources || [];
  const used =
    x.pick === "sum"
      ? "모두 합산"
      : x.pick === "manual"
        ? EST_MANUAL_FILE
        : src.length
          ? (src.find((y) => y.id === x.pick) || cheapest(src)).file
          : EST_MANUAL_FILE;
  return used + (src.length > 1 ? ` (비교 ${src.length}개)` : "");
}

/** 부가세율 (설정 없으면 10%) */
export const estVatRate = (st: EstSettings) => (st.vatRate === undefined ? 10 : Number(st.vatRate));

/** 계약금액 출처 파일 목록 */
export const contractFromFiles = (st: EstSettings) => (st.contractFrom || "").split(/\s*[,+]\s*/).filter(Boolean);

export interface EstimateSummary {
  /** 저장된 계약금액 (없으면 0) */
  contract: number;
  /** 공종별 견적금액 합계 */
  quoteSum: number;
  /** 계산 기준 견적금액 = 계약금액 우선, 없으면 견적 합계 */
  quote: number;
  /** 실행금액 합계 */
  cost: number;
  /** 예상 이익 = quote - cost */
  profit: number;
  /** 견적(계약) 대비 이익률(%) */
  rate: number;
  /** 실행금액이 없는 항목 수 */
  missingCost: number;
  vatRate: number;
}

/**
 * 견적 대비 이익률 요약 (대시보드·보고서에서 사용).
 * 계약금액(estSettings.contract)이 있으면 그 금액, 없으면 공종별 견적 합계를 기준으로 계산합니다.
 */
export function estimateSummary(items: EstimateItem[], settings: EstSettings = {}): EstimateSummary {
  const contract = Number(settings.contract) || 0;
  const quoteSum = items.reduce((t, x) => t + (Number(x.quote) || 0), 0);
  const quote = contract || quoteSum;
  const cost = items.reduce((t, x) => t + estCostOf(x), 0);
  const profit = quote - cost;
  return {
    contract,
    quoteSum,
    quote,
    cost,
    profit,
    rate: quote ? (profit / quote) * 100 : 0,
    missingCost: items.filter((x) => !estCostOf(x)).length,
    vatRate: estVatRate(settings),
  };
}

export interface ImportedFile {
  kind: "cost" | "quote";
  file: string;
  amount: number;
  trades: number;
  on: number;
  off: boolean;
}

/** 불러온 견적서 파일 목록 (실행금액/견적금액 구분) */
export function estFileList(items: EstimateItem[]): ImportedFile[] {
  const m: Record<string, Omit<ImportedFile, "off">> = {};
  items.forEach((x) => {
    (x.sources || []).forEach((y) => {
      if (y.file === EST_MANUAL_FILE) return;
      const k = "cost\u0001" + y.file;
      if (!m[k]) m[k] = { kind: "cost", file: y.file, amount: 0, trades: 0, on: 0 };
      m[k].amount += y.amount;
      m[k].trades++;
      if (!y.off) m[k].on++;
    });
    const qf = x.quoteSrc ? x.quoteSrc.file : x.quoteFrom;
    if (qf) {
      const k = "quote\u0001" + qf;
      if (!m[k]) m[k] = { kind: "quote", file: qf, amount: 0, trades: 0, on: 0 };
      m[k].amount += x.quoteSrc ? x.quoteSrc.amount : Number(x.quote) || 0;
      m[k].trades++;
      if (!(x.quoteSrc && x.quoteSrc.off)) m[k].on++;
    }
  });
  return Object.values(m)
    .map((f) => ({ ...f, off: f.on === 0 }))
    .sort((p, q) => p.kind.localeCompare(q.kind) || p.file.localeCompare(q.file));
}
