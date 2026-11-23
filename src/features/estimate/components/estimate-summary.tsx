"use client";

import { Button, Panel, Stat, StatGroup } from "@/components/ui";
import { cn } from "@/lib/cn";
import { estimateSummary } from "../lib/calc";
import { moneyKRW, signedKRW, vatSplit } from "../lib/money";
import type { EstimateItem, EstSettings } from "../types";

export function EstimateSummaryCards({
  items,
  settings,
  onEditContract,
}: {
  items: EstimateItem[];
  settings: EstSettings;
  onEditContract: () => void;
}) {
  const s = estimateSummary(items, settings);
  const R = s.vatRate;
  const qv = vatSplit(s.quote, "excl", R),
    cv = vatSplit(s.cost, "excl", R);
  const neg = s.profit < 0;
  const quoteHint = s.contract
    ? `부가세 포함 ${moneyKRW(qv.total)} (부가세 ${moneyKRW(qv.vat)})` +
      (settings.contractFrom
        ? ` · 견적서에서 자동 입력 (${settings.contractFrom})`
        : settings.vatMode === "incl"
          ? " · 입력: 부가세 포함"
          : "")
    : s.quoteSum
      ? "공종별 견적 합계입니다. 계약금액을 입력하면 그 금액으로 계산합니다"
      : "계약금액을 입력해 주세요";
  const costPct = s.quote ? Math.min(100, (s.cost / s.quote) * 100) : 0;
  const profitPct = s.quote ? Math.max(0, 100 - costPct) : 0;

  return (
    <>
      <StatGroup>
        <Stat
          label={
            <span className="flex flex-wrap items-center gap-2">
              계약 견적금액 (공급가액)
              <Button variant="link" className="no-print" onClick={onEditContract}>
                입력·수정
              </Button>
            </span>
          }
          value={moneyKRW(s.quote)}
          hint={quoteHint}
        />
        <Stat
          label="총 실행금액 (공급가액)"
          value={moneyKRW(s.cost)}
          hint={s.cost ? `부가세 포함 ${moneyKRW(cv.total)}` : undefined}
        />
        <Stat label="예상 이익" value={moneyKRW(s.profit)} tone={neg ? "danger" : undefined} />
        <Stat label="계약금액 대비 이익률" value={s.rate.toFixed(1) + "%"} tone={neg ? "danger" : undefined} />
      </StatGroup>

      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[13px] text-sub">남는 이윤 = 계약 공급가액 − 실행 공급가액 (부가세는 따로 계산)</div>
            <div
              className={cn(
                "mt-1 mb-0.5 text-[30px] leading-[1.15] font-extrabold tracking-[-0.045em] md:text-[40px]",
                neg && "text-danger",
              )}
            >
              {signedKRW(s.profit)}
            </div>
            <div className="text-[13px] text-sub">
              {s.quote
                ? `이윤율 ${s.rate.toFixed(1)}%` + (neg ? " · 실행금액이 계약금액을 넘었습니다" : "")
                : "계약 견적금액을 입력하면 이윤이 계산됩니다"}
            </div>
          </div>
          <div className="w-full text-[13.5px] leading-[1.9] text-fg-2 sm:w-auto md:text-right [&_b]:text-[15px] [&_b]:text-fg">
            계약 공급가액 <b>{moneyKRW(s.quote)}</b>
            <br />− 실행 공급가액 <b>{moneyKRW(s.cost)}</b>
            <br />= 이윤 <b className={neg ? "!text-danger" : "!text-success"}>{signedKRW(s.profit)}</b>
            <div className="mt-3.5 grid grid-cols-[1fr_auto_auto_auto] gap-x-4 gap-y-1 border-t border-line-2 pt-3 text-right text-[13px] leading-normal [&_b]:text-[13px]">
              <div />
              <div className="text-xs text-sub">공급가액</div>
              <div className="text-xs text-sub">부가세 {R}%</div>
              <div className="text-xs text-sub">부가세 포함</div>
              {(
                [
                  ["계약", qv.supply, qv.vat, qv.total],
                  ["실행", cv.supply, cv.vat, cv.total],
                  ["차액", qv.supply - cv.supply, qv.vat - cv.vat, qv.total - cv.total],
                ] as const
              ).map(([label, a, b, c]) => (
                <div key={label} className="contents">
                  <div className="text-left text-sub">{label}</div>
                  <div>{moneyKRW(a)}</div>
                  <div>{moneyKRW(b)}</div>
                  <div>
                    <b>{moneyKRW(c)}</b>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-[18px] mb-2.5 flex h-3.5 overflow-hidden rounded-full bg-fill">
          <div className={cn("transition-[width] duration-300", neg ? "bg-danger" : "bg-fg")} style={{ width: costPct + "%" }} />
          <div className="bg-success transition-[width] duration-300" style={{ width: profitPct + "%" }} />
        </div>
        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-1 text-[13px]">
          <span>
            <i className={cn("mr-1.5 inline-block size-2.5 rounded-[3px] align-[-1px]", neg ? "bg-danger" : "bg-fg")} />
            실행금액 <b>{(s.quote ? (s.cost / s.quote) * 100 : 0).toFixed(1)}%</b>
          </span>
          <span>
            <i className="mr-1.5 inline-block size-2.5 rounded-[3px] bg-success align-[-1px]" />
            이윤 <b>{(s.quote ? Math.max(0, s.rate) : 0).toFixed(1)}%</b>
          </span>
          <span className="text-sub">
            {(s.missingCost ? `실행금액이 없는 공종 ${s.missingCost}개 · ` : "") +
              "이윤은 공급가액 기준 (부가세는 받은 만큼 내는 돈이라 이윤에서 제외)"}
          </span>
        </div>
      </Panel>
    </>
  );
}
