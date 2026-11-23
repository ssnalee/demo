export const INSPECTION_TYPES = ["일일", "주간", "월간", "특별"] as const;
export const INSPECTION_ITEMS = [
  "비계 및 작업발판",
  "개구부·안전난간",
  "임시전기·분전반",
  "화기작업·소화설비",
  "지하층 환기·가스",
  "철거구조물·낙하물",
  "자재 적치·통로",
  "보호구 착용",
] as const;
export const INSPECTION_RESULTS = ["적합", "부적합", "해당없음"] as const;

/** 저장 키: inspections */
export interface Inspection {
  id: string;
  date: string;
  type: string;
  floor: string;
  inspector: string;
  item: string;
  result: string;
  note: string;
}
