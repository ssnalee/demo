/** 실행금액 비교견적 출처 (파일 1개 = 업체 1곳) */
export interface EstimateSource {
  id: string;
  /** 파일명 또는 "직접 입력" */
  file: string;
  amount: number;
  /** 세부 항목 수 */
  count: number;
  at: string;
  /** true면 계산에서 제외 */
  off?: boolean;
}

/** 견적금액을 넣은 파일 정보 */
export interface EstimateQuoteSource {
  file: string;
  amount: number;
  off?: boolean;
}

/** 저장 키: estimateExecutions — 공종별 견적·실행 항목 */
export interface EstimateItem {
  id: string;
  trade: string;
  title: string;
  /** 견적금액 (공급가액) */
  quote: number;
  /** 실행금액 (공급가액). sources가 있으면 estCostOf 결과와 동기화됨 */
  cost: number;
  note: string;
  updatedAt?: string;
  sources?: EstimateSource[];
  /** 비교견적 중 선택: source id | "sum" | "manual" | "" (가장 낮은 금액) */
  pick?: string;
  manualCost?: number;
  quoteFrom?: string;
  quoteSrc?: EstimateQuoteSource;
}

export type VatMode = "incl" | "excl";

/** 저장 키: estSettings — 배열의 첫 번째 객체만 사용 */
export interface EstSettings {
  /** 계약금액 (공급가액) */
  contract?: number;
  /** 사용자가 입력한 원래 금액 (부가세 포함일 수 있음) */
  contractInput?: number;
  vatMode?: VatMode;
  vatRate?: number;
  /** 견적서에서 자동 입력한 경우 파일명 (", " 또는 " + "로 구분) */
  contractFrom?: string;
  /** 견적서 파일을 제외할 때 잠시 보관한 계약금액 */
  contractStash?: number;
}

export type EstView = "cost" | "compare";

export const EST_VIEW_OPTIONS: { value: EstView; label: string }[] = [
  { value: "cost", label: "실행금액만 보기" },
  { value: "compare", label: "견적·실행 비교" },
];

export const EST_MANUAL_FILE = "직접 입력";
