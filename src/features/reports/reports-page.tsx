"use client";

import { Badge, Button, DataTable, PageHeader, Panel, type Column } from "@/components/ui";
import type { Action } from "@/features/actions";
import type { Incident } from "@/features/incident";
import type { Inspection } from "@/features/inspection";
import type { Permit } from "@/features/permit";
import { riskTone, type Risk } from "@/features/risk";
import type { Training } from "@/features/training";
import type { WorkDiary } from "@/features/workdiary";
import type { Workplan } from "@/features/workplan";
import { useList } from "@/lib/storage/hooks";
import { useCurrentSite } from "@/lib/site-store";
import { siteSummaryText, toSiteInfo } from "@/lib/storage/site-info";
import type { ReactNode } from "react";

const two = (a: ReactNode, b: ReactNode) => (
  <>
    {a}
    <br />
    {b}
  </>
);

const riskCols: Column<Risk>[] = [
  { key: "d", header: "일자·층", cell: (x) => two(x.date, x.floor) },
  { key: "h", header: "공종·위험요인", cell: (x) => two(x.trade, x.hazard) },
  { key: "s", header: "점수", cell: (x) => <Badge tone={riskTone(x.score)}>{x.score}점</Badge> },
  { key: "c", header: "개선대책·상태", cell: (x) => two(x.control, x.status) },
];
const inspectionCols: Column<Inspection>[] = [
  { key: "d", header: "일자·장소", cell: (x) => `${x.date} · ${x.floor}` },
  { key: "i", header: "항목", cell: (x) => x.item },
  { key: "r", header: "결과", cell: (x) => x.result },
  { key: "n", header: "내용", cell: (x) => x.note },
];
const workplanCols: Column<Workplan>[] = [
  { key: "d", header: "작업일·층", cell: (x) => `${x.date} · ${x.floor}` },
  { key: "t", header: "공종·작업명", cell: (x) => two(x.trade, x.title) },
  { key: "w", header: "인원", cell: (x) => `${Number(x.workers) || 0}명` },
  { key: "s", header: "상태", cell: (x) => x.status },
];
const diaryCols: Column<WorkDiary>[] = [
  { key: "d", header: "작업일·층", cell: (x) => `${x.date} · ${x.floor}` },
  { key: "t", header: "공종·작업명", cell: (x) => two(x.trade, x.title) },
  { key: "w", header: "실제 인원", cell: (x) => `${Number(x.actualWorkers) || 0}명` },
  { key: "p", header: "진행률", cell: (x) => `${Number(x.progress) || 0}%` },
  { key: "i", header: "사고 여부", cell: (x) => x.incident || "" },
];

/** 저장된 자료를 한 화면에 모아 브라우저 인쇄(PDF 저장)로 출력 */
export function ReportsPage() {
  const site = useCurrentSite();
  const info = site ? toSiteInfo(site) : undefined;
  const risks = useList<Risk>("risks");
  const actions = useList<Action>("actions");
  const inspections = useList<Inspection>("inspections");
  const permits = useList<Permit>("permits");
  const trainings = useList<Training>("trainings");
  const incidents = useList<Incident>("incidents");
  const workplans = useList<Workplan>("workplans");
  const diaries = useList<WorkDiary>("workdiaries");
  const summary = info ? siteSummaryText(info) : "";

  return (
    <>
      <PageHeader
        title="안전관리 보고서"
        description="현재 브라우저에 저장된 시제품 데이터를 출력합니다."
        actions={
          <Button variant="primary" onClick={() => window.print()}>
            인쇄 / PDF 저장
          </Button>
        }
      />
      <Panel title="현장 안전관리 요약">
        <p>
          <b>{info?.name || "현장 안전관리"}</b>
          {summary && ` · ${summary}`}
        </p>
        <p className="mt-2 text-fg-2">
          위험요인 {risks.length}건 · 미완료 개선조치 {actions.filter((x) => x.status !== "확인완료").length}건 · 안전점검{" "}
          {inspections.length}건 · 작업허가 {permits.length}건 · 교육 {trainings.length}건 · 사고/아차사고 {incidents.length}건
        </p>
      </Panel>
      <ReportSection title="위험성평가 및 개선조치 현황" rows={risks} columns={riskCols} />
      <ReportSection title="안전점검 현황" rows={inspections} columns={inspectionCols} />
      <ReportSection title="작업계획서 현황" rows={workplans} columns={workplanCols} />
      <ReportSection title="작업일보 현황" rows={diaries} columns={diaryCols} />
    </>
  );
}

function ReportSection<T extends { id: string }>({ title, rows, columns }: { title: string; rows: T[]; columns: Column<T>[] }) {
  return (
    <Panel title={title} className="mt-3 break-inside-avoid-page print:border-0 print:p-0">
      <DataTable rows={rows} columns={columns} />
    </Panel>
  );
}
