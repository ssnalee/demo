"use client";

import { PageHeader, scrollToId } from "@/components/ui";
import { useState } from "react";
import { RISK_FORM_ID, RiskForm } from "./components/risk-form";
import { RiskTable } from "./components/risk-table";
import type { Risk } from "./types";

export function RiskPage() {
  const [editing, setEditing] = useState<Risk | null>(null);
  return (
    <>
      <PageHeader title="위험성평가 등록" description="작업 단계별 유해·위험요인과 개선대책을 기록합니다." />
      <RiskForm editing={editing} onDone={() => setEditing(null)} />
      <RiskTable
        onEdit={(x) => {
          setEditing({ ...x });
          scrollToId(RISK_FORM_ID);
        }}
      />
    </>
  );
}
