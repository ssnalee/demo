"use client";

import { Button, Muted, Panel } from "@/components/ui";
import { cn } from "@/lib/cn";
import { estFileList } from "../lib/calc";
import { estRemoveImported, estToggleFile } from "../lib/store";
import type { EstimateItem } from "../types";
import { openEstimateImport } from "./estimate-import";

/** 불러온 견적서 파일 목록: 포함/제외 토글, 삭제 */
export function EstimateFiles({ items }: { items: EstimateItem[] }) {
  const list = estFileList(items);
  return (
    <Panel
      title="불러온 견적서 파일"
      actions={
        <Button size="sm" className="no-print" onClick={openEstimateImport}>
          + 파일 넣기
        </Button>
      }
    >
      {list.length ? (
        <>
          <Muted className="mb-2 text-[12.5px]">
            [포함]을 누르면 계산에서 빠지고(제외), 다시 누르면 들어갑니다. 파일 자체를 없애려면 [삭제]를 누르세요.
          </Muted>
          {list.map((f) => (
            <div
              key={f.kind + f.file}
              className={cn(
                "mb-1.5 grid grid-cols-[auto_1fr] items-center gap-2.5 rounded-[10px] border border-line px-3 py-2.5 text-[13.5px] sm:grid-cols-[auto_1fr_auto_auto]",
                f.off && "bg-bg",
              )}
            >
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11.5px] font-bold whitespace-nowrap",
                  f.kind === "cost" ? "bg-fill text-fg" : "bg-info-soft text-info",
                )}
              >
                {f.kind === "cost" ? "실행금액" : "견적금액"}
              </span>
              <b className={cn("font-[650] break-all", f.off && "text-sub line-through")}>{f.file}</b>
              <span className={cn("whitespace-nowrap text-fg-2 tabular-nums", f.off && "text-sub line-through")}>
                공종 {f.trades}개 · {f.amount.toLocaleString("ko-KR")}원
              </span>
              <span className="flex gap-1.5 justify-self-end">
                <button
                  type="button"
                  aria-pressed={!f.off}
                  onClick={() => estToggleFile(f.kind, f.file)}
                  className={cn(
                    "min-w-[74px] cursor-pointer rounded-lg border px-[11px] py-1.5 text-[12.5px] font-semibold",
                    f.off ? "border-line bg-white text-sub" : "border-fg bg-fg text-white",
                  )}
                >
                  {f.off ? "제외됨" : "포함 ✓"}
                </button>
                <Button size="sm" variant="danger" onClick={() => estRemoveImported(f.kind, f.file)}>
                  삭제
                </Button>
              </span>
            </div>
          ))}
        </>
      ) : (
        <Muted>아직 불러온 견적서 파일이 없습니다. [+ 파일 넣기]로 엑셀·PDF 견적서를 넣으면 여기에 표시됩니다.</Muted>
      )}
    </Panel>
  );
}
