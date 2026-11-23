"use client";

import { Button, Chip } from "@/components/ui";
import { catalogOf, type MasterKind } from "@/constants/masters";
import { cn } from "@/lib/cn";
import { setAllMaster, setMasterValues, toggleMaster } from "../lib";
import { masterLabel } from "../types";
import { useUsedMasters } from "./use-used-masters";

/** 카탈로그 칩 선택 (켜진 항목만 각 메뉴의 선택목록에 나옴) */
export function MasterCatalog({ kind, values }: { kind: MasterKind; values: string[] }) {
  const used = useUsedMasters(kind);
  const on = new Set(values);
  const known = new Set(catalogOf(kind).flatMap((g) => g[1]));
  const custom = [...new Set([...values, ...used])].filter((v) => !known.has(v));
  const groups = [...catalogOf(kind)];
  if (custom.length) groups.push(["직접 추가했거나 기록에 남아 있는 항목", custom]);

  return (
    <div>
      {groups.map(([g, items]) => (
        <div key={g} className="mb-3.5">
          <div className="mb-2 flex items-center gap-3 text-[12.5px] font-semibold text-sub">
            <span>{g}</span>
            <Button variant="link" onClick={() => setMasterValues(kind, items, true)}>
              모두 선택
            </Button>
            <Button variant="link" onClick={() => setMasterValues(kind, items, false)}>
              모두 해제
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {items.map((v) => (
              <Chip
                key={v}
                on={on.has(v)}
                title={used.has(v) ? "기록에서 사용 중" : undefined}
                className={cn(on.has(v) && used.has(v) && "border-fg-2 bg-fg-2")}
                onClick={() => toggleMaster(kind, v)}
              >
                {v}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** "층·구역 선택" 제목줄 오른쪽: 사용 개수 + 전체 선택/해제 */
export function MasterToolbar({ kind, count }: { kind: MasterKind; count: number }) {
  return (
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-base font-[650] tracking-[-0.02em]">{masterLabel(kind)} 선택</h3>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-sub">{count}개 사용 중</span>
        <Button size="sm" onClick={() => setAllMaster(kind, true)}>
          전체 선택
        </Button>
        <Button size="sm" onClick={() => setAllMaster(kind, false)}>
          전체 해제
        </Button>
      </div>
    </div>
  );
}
