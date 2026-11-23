"use client";

import { Stat, StatGroup, StatMini, StatStrip } from "@/components/ui";
import type { Action } from "@/features/actions";
import { estimateSummary, type EstimateItem, type EstSettings } from "@/features/estimate";
import { processSummary, useProcesses } from "@/features/process";
import { isHighRisk, type Risk } from "@/features/risk";
import type { Inspection } from "@/features/inspection";
import type { Attendance, Worker } from "@/features/workforce";
import { today } from "@/lib/date";
import { pct } from "@/lib/format";
import { useList } from "@/lib/storage/hooks";
import { activeWorkerCount, isActionOpen } from "../lib";

/** 견적 대비 이익률: 계약금액이 있으면 우선, 없으면 견적 합계 기준 */
function useEstimateRate() {
  const items = useList<EstimateItem>("estimateExecutions");
  const settings = useList<EstSettings>("estSettings")[0];
  return estimateSummary(items, settings ?? {}).rate;
}

export function KpiCards() {
  const risks = useList<Risk>("risks");
  const actions = useList<Action>("actions");
  const inspections = useList<Inspection>("inspections");
  const workers = useList<Worker>("workers");
  const attendance = useList<Attendance>("attendance");
  const processes = useProcesses().items ?? [];
  const estimateRate = useEstimateRate();
  const todayStr = today();

  const openActions = actions.filter(isActionOpen).length;
  const highRisks = risks.filter((x) => isHighRisk(x.score)).length;
  const todayCrew = attendance.filter((x) => x.date === todayStr && x.status === "출역").length;

  return (
    <>
      <StatGroup className="min-[480px]:grid-cols-2 lg:grid-cols-4">
        <Stat label="금일 출역인원" value={`${todayCrew}명`} icon="hardhat" />
        <Stat label="미완료 개선조치" value={`${openActions}건`} tone={openActions ? "danger" : undefined} icon="wrench" />
        <Stat label="고위험 항목" value={`${highRisks}건`} tone={highRisks ? "danger" : undefined} icon="shield" />
        <Stat label="전체 공정률" value={pct(processSummary(processes).overall)} icon="progress" />
      </StatGroup>
      <StatStrip>
        {/* 위 카드와 같은 칸끼리 같은 주제: 인력 · 점검/조치 · 위험 · 공정/비용 */}
        <StatMini label="등록 근로자" value={`${activeWorkerCount(workers)}명`} icon="users" />
        <StatMini label="안전점검 등록" value={`${inspections.length}건`} icon="search" />
        <StatMini label="등록 위험요인" value={`${risks.length}건`} icon="alert" />
        <StatMini label="견적 대비 이익률" value={pct(estimateRate)} icon="trend" />
      </StatStrip>
    </>
  );
}
