/** 파일에서 읽은 표 한 장 */
export type SheetCell = string | number | boolean;

export interface Sheet {
  name: string;
  rows: SheetCell[][];
  /** PDF에서 만든 표: 공종 제목 판단을 엄격하게 */
  strict?: boolean;
}
