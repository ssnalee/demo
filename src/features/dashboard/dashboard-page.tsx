"use client";

import { PageHeader } from "@/components/ui";
import { KpiCards } from "./components/kpi-cards";
import { ScheduleOverview } from "./components/schedule-overview";
import { FloorSummary, RecentRisks, TodayTrades } from "./components/site-tables";

export function DashboardPage() {
  return (
    <>
      <PageHeader title="현장 대시보드" />
      <KpiCards />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TodayTrades />
        <ScheduleOverview />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <FloorSummary />
        <RecentRisks />
      </div>
    </>
  );
}
