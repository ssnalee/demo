"use client";

import { Badge, DataTable, Field, FormGrid, Muted, Panel, PhotoThumb, Select, type Column } from "@/components/ui";
import { useList } from "@/lib/storage/hooks";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useState, type ReactNode } from "react";

// 다른 화면의 기록 중 여기서 보여 주는 필드만 (원본 필드명 그대로)
type Base = { id: string; floor?: string; trade?: string };
type Plan = Base & { date?: string; title?: string; workers?: number | string; status?: string };
type Diary = Base & {
  date?: string;
  title?: string;
  actual?: string;
  actualWorkers?: number | string;
  progress?: number | string;
  photos?: Partial<Record<"before" | "during" | "after", string>>;
};
type Risk = Base & { date?: string; hazard?: string; score?: number | string };
type Insp = Base & { date?: string; item?: string; result?: string; inspector?: string; note?: string };
type Action = Base & { title?: string; control?: string; owner?: string; due?: string; status?: string };
type Permit = Base & { type?: string; start?: string; end?: string; note?: string; applicant?: string; status?: string };
type Incident = Base & { date?: string; type?: string; narrative?: string; reporter?: string };

const col = <T,>(key: string, header: string, cell: (x: T) => ReactNode): Column<T> => ({ key, header, cell });
const n = (v: unknown) => Number(v) || 0;

/** 층 선택 → 그 층의 작업계획·일보·위험성평가·점검·개선조치·허가·사고 현황 */
export function FloorOverview() {
  const { floors, trades, floorGroups } = useGroupedMasters();
  const [floorSel, setFloor] = useState("");
  const [tradeSel, setTrade] = useState("");
  const floor = floorSel && floors.includes(floorSel) ? floorSel : floors[0];
  const trade = tradeSel && trades.includes(tradeSel) ? tradeSel : "";

  const match = (x: Base) => x.floor === floor && (!trade || !x.trade || x.trade === trade);
  const onFloor = (x: Base) => x.floor === floor;
  const plans = useList<Plan>("workplans").filter(match);
  const diaries = useList<Diary>("workdiaries").filter(match);
  const risks = useList<Risk>("risks").filter(match);
  const inspections = useList<Insp>("inspections").filter(onFloor);
  const actions = useList<Action>("actions").filter(onFloor);
  const permits = useList<Permit>("permits").filter(onFloor);
  const incidents = useList<Incident>("incidents").filter(onFloor);

  const summary: [string, number][] = [
    ["작업계획서", plans.length],
    ["작업일보", diaries.length],
    ["위험성평가", risks.length],
    ["안전점검", inspections.length],
    ["미완료 개선조치", actions.filter((x) => x.status !== "확인완료").length],
    ["작업허가", permits.length],
    ["사고·아차사고", incidents.length],
  ];

  return (
    <Panel title="층별 현황 조회">
      <FormGrid>
        <Field label="조회 층·구역">
          <Select groups={floorGroups} value={floor ?? ""} onChange={(e) => setFloor(e.target.value)} />
        </Field>
        <Field label="공종 필터">
          <Select placeholder="전체 공종" options={trades} value={trade} onChange={(e) => setTrade(e.target.value)} />
        </Field>
      </FormGrid>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {summary.map(([label, v]) => (
          <div key={label} className="rounded-xl border border-line bg-surface px-3.5 py-3">
            <div className="text-[12.5px] text-sub">{label}</div>
            <div className="mt-1 text-xl font-bold tracking-[-0.03em]">{v}건</div>
          </div>
        ))}
      </div>

      <Section title="작업계획서">
        <DataTable
          rows={plans}
          columns={[
            col<Plan>("date", "작업일", (x) => x.date),
            col<Plan>("title", "공종·작업명", (x) => (
              <>
                {x.trade}
                <br />
                <b>{x.title}</b>
              </>
            )),
            col<Plan>("workers", "예정인원", (x) => `${n(x.workers)}명`),
            col<Plan>("status", "상태", (x) => x.status || "미지정"),
          ]}
        />
      </Section>
      <Section title="작업일보 및 현장사진">
        <DataTable
          rows={diaries}
          columns={[
            col<Diary>("date", "작업일", (x) => x.date),
            col<Diary>("title", "실제 작업내용", (x) => (
              <>
                {x.trade}
                <br />
                <b>{x.title}</b>
                {x.actual && <Muted>{x.actual}</Muted>}
              </>
            )),
            col<Diary>("w", "실제인원", (x) => `${n(x.actualWorkers)}명`),
            col<Diary>("p", "진행률", (x) => `${n(x.progress)}%`),
            col<Diary>("photo", "사진", (x) =>
              (["before", "during", "after"] as const).map((s) => <PhotoThumb key={s} src={x.photos?.[s]} alt="현장사진" />),
            ),
          ]}
        />
      </Section>
      <Section title="위험성평가">
        <DataTable
          rows={risks}
          columns={[
            col<Risk>("date", "평가일", (x) => x.date),
            col<Risk>("trade", "공종", (x) => x.trade),
            col<Risk>("hazard", "위험요인", (x) => x.hazard),
            col<Risk>("score", "위험점수", (x) => `${n(x.score)}점`),
          ]}
        />
      </Section>
      <Section title="안전점검">
        <DataTable
          rows={inspections}
          columns={[
            col<Insp>("date", "점검일", (x) => x.date),
            col<Insp>("item", "점검항목", (x) => x.item),
            col<Insp>("result", "결과", (x) => x.result),
            col<Insp>("inspector", "점검자", (x) => x.inspector),
            col<Insp>("note", "점검내용", (x) => x.note),
          ]}
        />
      </Section>
      <Section title="개선조치">
        <DataTable
          rows={actions}
          columns={[
            col<Action>("title", "개선대상", (x) => x.title),
            col<Action>("control", "개선대책", (x) => x.control),
            col<Action>("owner", "담당자", (x) => x.owner),
            col<Action>("due", "기한", (x) => x.due),
            col<Action>("status", "상태", (x) =>
              x.status ? <Badge tone={x.status === "확인완료" ? "success" : "warning"}>{x.status}</Badge> : null,
            ),
          ]}
        />
      </Section>
      <Section title="작업허가">
        <DataTable
          rows={permits}
          columns={[
            col<Permit>("type", "허가종류", (x) => x.type),
            col<Permit>("time", "작업시간", (x) => `${x.start || ""} ~ ${x.end || ""}`),
            col<Permit>("note", "작업내용", (x) => x.note),
            col<Permit>("applicant", "신청자", (x) => x.applicant),
            col<Permit>("status", "상태", (x) => x.status),
          ]}
        />
      </Section>
      <Section title="사고·아차사고">
        <DataTable
          rows={incidents}
          columns={[
            col<Incident>("date", "일자", (x) => x.date),
            col<Incident>("type", "유형", (x) => x.type),
            col<Incident>("narrative", "내용", (x) => x.narrative),
            col<Incident>("reporter", "보고자", (x) => x.reporter),
          ]}
        />
      </Section>
    </Panel>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel inset title={title} className="mt-3">
      {children}
    </Panel>
  );
}
