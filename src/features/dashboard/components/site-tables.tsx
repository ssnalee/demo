"use client";

import { Badge, DataTable, Muted, Panel } from "@/components/ui";
import type { Action } from "@/features/actions";
import { riskTone, type Risk } from "@/features/risk";
import type { Attendance } from "@/features/workforce";
import { today } from "@/lib/date";
import { useList } from "@/lib/storage/hooks";
import { useMasters } from "@/lib/storage/masters";
import { floorRiskSummary, todayTradeCounts } from "../lib";

export function TodayTrades() {
  const rows = todayTradeCounts(useList<Attendance>("attendance"), today()).map(([trade, count]) => ({
    id: trade,
    trade,
    count,
  }));
  return (
    <Panel title="금일 출역 공종 현황" icon="hardhat" className="mt-0 flex flex-col">
      {rows.length ? (
        <DataTable
          rows={rows}
          columns={[
            { key: "trade", header: "공종", cell: (x) => x.trade },
            { key: "count", header: "출역인원", cell: (x) => `${x.count}명` },
          ]}
        />
      ) : (
        // 옆 일정 카드 높이에 맞춰 남는 공간을 빈 상태 상자로 채움
        <p className="flex flex-1 items-center justify-center rounded-xl bg-[#f8f9fc] px-4 py-3 text-[13px] text-sub">
          금일 출역 등록 내역이 없습니다.
        </p>
      )}
    </Panel>
  );
}

export function FloorSummary() {
  const { floors } = useMasters();
  // 위험요인이나 미완료 조치가 있는 층만 표시
  const rows = floorRiskSummary(floors, useList<Risk>("risks"), useList<Action>("actions")).filter(
    (x) => x.risks > 0 || x.openActions > 0,
  );
  return (
    <Panel title="층별 위험현황" icon="layers" className="mt-0">
      <DataTable
        compactEmpty
        empty="위험요인이 등록된 층이 없습니다."
        rows={rows}
        columns={[
          { key: "floor", header: "층·구역", cell: (x) => x.floor },
          { key: "risks", header: "위험요인", cell: (x) => `${x.risks}건` },
          {
            key: "open",
            header: "미완료 조치",
            cell: (x) => <span className={x.openActions ? "text-danger" : undefined}>{x.openActions}건 미완료</span>,
          },
        ]}
      />
    </Panel>
  );
}

export function RecentRisks() {
  const risks = useList<Risk>("risks").slice(0, 5);
  return (
    <Panel title="최근 등록 위험요인" icon="alert" iconColor="danger" className="mt-0">
      <DataTable
        compactEmpty
        empty="등록된 위험요인이 없습니다."
        rows={risks}
        columns={[
          {
            key: "hazard",
            header: "위험요인",
            cell: (x) => (
              <>
                <Muted>
                  {x.floor} · {x.trade}
                </Muted>
                {x.hazard}
              </>
            ),
          },
          { key: "score", header: "초기점수", cell: (x) => <Badge tone={riskTone(x.score)}>{x.score}점</Badge> },
        ]}
      />
    </Panel>
  );
}
