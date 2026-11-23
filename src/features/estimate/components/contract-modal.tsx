"use client";

import { Button, Field, Input, Modal, Select, toast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { estVatRate } from "../lib/calc";
import { moneyKRW, parseMoneyKR, vatSplit } from "../lib/money";
import { getEstSettings, saveEstSettings } from "../lib/store";
import type { VatMode } from "../types";

const BAD = "금액을 알아볼 수 없습니다. 예: 2억2천 또는 220000000";

/** 계약 견적금액 입력 (부가세 포함/별도, 한글 금액 지원). 열 때마다 새로 마운트 */
export function ContractModal({ onClose }: { onClose: () => void }) {
  const [init] = useState(() => {
    const st = getEstSettings();
    const base = st.contractInput || st.contract;
    return {
      amount: base ? Number(base).toLocaleString("ko-KR") : "",
      mode: (st.vatMode || "excl") as VatMode,
      rate: String(estVatRate(st)),
    };
  });
  const [amount, setAmount] = useState(init.amount);
  const [mode, setMode] = useState<VatMode>(init.mode);
  const [rate, setRate] = useState(init.rate);

  const n = parseMoneyKR(amount);
  const v = Number.isFinite(n) ? vatSplit(n, mode, rate) : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = amount.trim(),
      val = raw ? parseMoneyKR(raw) : 0;
    if (!Number.isFinite(val) || val < 0) return toast(BAD, "danger");
    const r = Number(rate),
      sp = vatSplit(val, mode, r);
    saveEstSettings({ ...getEstSettings(), contract: sp.supply, contractInput: val, vatMode: mode, vatRate: r, contractFrom: "" });
    toast("계약금액을 저장했습니다.");
    onClose();
  };

  return (
    <Modal open onClose={onClose} size="sm" title="계약 견적금액" description="부가세 포함 여부를 고르면 공급가액과 부가세를 나눠서 계산합니다.">
      <form onSubmit={submit}>
        <Field label="계약금액">
          <Input
            autoFocus
            autoComplete="off"
            placeholder="예: 2억2천, 220000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <div className="mb-1.5 text-[13px] font-semibold text-fg-2">이 금액은</div>
        <div className="mb-4 grid grid-cols-2 gap-1.5">
          {(
            [
              ["incl", "부가세 포함"],
              ["excl", "부가세 별도 (공급가액)"],
            ] as const
          ).map(([val, label]) => (
            <label
              key={val}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2.5 text-[13.5px] font-semibold",
                mode === val ? "border-fg bg-fill" : "border-line",
              )}
            >
              <input type="radio" name="ctVat" value={val} checked={mode === val} onChange={() => setMode(val)} className="accent-fg" />
              {label}
            </label>
          ))}
        </div>
        <Field label="부가세율">
          <Select
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            options={[
              { value: "10", label: "10%" },
              { value: "0", label: "면세 (0%)" },
            ]}
          />
        </Field>
        <div className="mb-4 rounded-xl bg-bg px-3.5 py-3 text-[13.5px] leading-[1.9]">
          {!amount.trim() ? (
            <span className="text-sub">금액을 입력하면 공급가액과 부가세가 계산됩니다.</span>
          ) : !v ? (
            <span className="text-danger">{BAD}</span>
          ) : (
            <>
              <div className="flex justify-between">
                공급가액 <b>{moneyKRW(v.supply)}</b>
              </div>
              <div className="flex justify-between">
                부가세 ({rate}%) <b>{moneyKRW(v.vat)}</b>
              </div>
              <div className="mt-1 flex justify-between border-t border-line pt-1 font-bold">
                합계 (부가세 포함) <b>{moneyKRW(v.total)}</b>
              </div>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="primary">
            저장
          </Button>
          <Button onClick={onClose}>취소</Button>
        </div>
      </form>
    </Modal>
  );
}
