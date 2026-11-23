"use client";

import { Notice, PageHeader, Panel } from "@/components/ui";
import { useMasters } from "@/lib/storage/masters";
import { FloorOverview } from "./components/floor-overview";
import { FloorRangeBar } from "./components/floor-range-bar";
import { MasterCatalog, MasterToolbar } from "./components/master-catalog";
import { MasterManual } from "./components/master-manual";

export function FloorsPage() {
  const { floors, trades } = useMasters();
  return (
    <>
      <PageHeader title="층별·공종 관리" />
      <Notice>
        층·구역을 선택하면 해당 위치의 작업계획, 작업일보, 위험성평가, 안전점검, 개선조치 및 관련 현황을 모아 볼 수 있습니다.
      </Notice>
      <Panel>
        <MasterToolbar kind="floor" count={floors.length} />
        <p className="-mt-1.5 mb-3.5 text-[13px] text-sub">
          항목을 누르면 켜지고, 다시 누르면 꺼집니다. 켜진 항목만 각 메뉴의 선택목록에 나옵니다. 기록에서 쓰고 있는 항목을 꺼도
          기존 기록 내용은 그대로 남습니다.
        </p>
        <FloorRangeBar />
        <MasterCatalog kind="floor" values={floors} />
        <div className="mt-5 border-t border-line-2 pt-5">
          <MasterToolbar kind="trade" count={trades.length} />
          <MasterCatalog kind="trade" values={trades} />
        </div>
        <MasterManual floors={floors} trades={trades} />
      </Panel>
      <FloorOverview />
    </>
  );
}
