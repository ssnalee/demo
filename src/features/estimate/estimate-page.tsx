"use client";

import { Notice, PageHeader, scrollToId } from "@/components/ui";
import { useCollection, useList } from "@/lib/storage/hooks";
import { useState } from "react";
import { ContractModal } from "./components/contract-modal";
import { EstimateFiles } from "./components/estimate-files";
import { ESTIMATE_FORM_ID, EstimateForm, type EstimateDraft } from "./components/estimate-form";
import { EstimateImport } from "./components/estimate-import";
import { EstimateSummaryCards } from "./components/estimate-summary";
import { EstimateTable } from "./components/estimate-table";
import { estCostOf } from "./lib/calc";
import type { EstimateItem, EstSettings } from "./types";

const NO_SETTINGS: EstSettings = {};

export function EstimatePage() {
  const { items } = useCollection<EstimateItem>("estimateExecutions");
  const settings = useList<EstSettings>("estSettings")[0] ?? NO_SETTINGS;
  const [editing, setEditing] = useState<EstimateDraft | null>(null);
  const [contractOpen, setContractOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="견적·실행 관리"
        description="공종별 견적금액과 실행금액을 비교하여 예상이익 및 견적 대비 이익률을 자동 계산합니다."
      />
      <Notice>
        이익 = 견적금액 - 실행금액 · 견적 대비 이익률 = 이익 ÷ 견적금액 × 100. 실행금액은 공종별 합계금액으로 입력합니다.
      </Notice>
      <EstimateImport />
      <EstimateFiles items={items} />
      <EstimateSummaryCards items={items} settings={settings} onEditContract={() => setContractOpen(true)} />
      <EstimateForm editing={editing} onDone={() => setEditing(null)} />
      <EstimateTable
        settings={settings}
        onEdit={(x) => {
          setEditing({
            id: x.id,
            trade: x.trade || "",
            title: x.title || "",
            quote: Number(x.quote) || 0,
            cost: estCostOf(x) || 0,
            note: x.note || "",
          });
          scrollToId(ESTIMATE_FORM_ID);
        }}
      />
      {contractOpen && <ContractModal onClose={() => setContractOpen(false)} />}
    </>
  );
}
