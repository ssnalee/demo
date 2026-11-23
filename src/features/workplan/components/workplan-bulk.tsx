"use client";

import { BulkEntryTable, useBulkRows, type BulkRow } from "@/components/data";
import { Button, Field, FormGrid, Input, Panel, Select, toast, confirmDialog } from "@/components/ui";
import { dateRange, today } from "@/lib/date";
import { createWorkplans, type WorkplanInput } from "@/server/actions/workplans";
import { useRouter } from "next/navigation";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useMemo, useState } from "react";
import { WORKPLAN_BULK_COLUMNS, autoWorkTitle } from "../lib";
import { reloadWorkplans, useWorkplans } from "../store";
import { WORKPLAN_BULK_STATUSES, type Workplan } from "../types";

/** 여러 줄 × 반복 일자로 작업계획서 한 번에 등록 (등록 페이지의 "여러 건 등록" 탭) */
export function WorkplanBulk() {
  const router = useRouter();
  const { siteId } = useWorkplans();
  const [busy, setBusy] = useState(false);
  const { floors, trades } = useGroupedMasters();
  const defaults = useMemo(() => ({ floor: floors[0] ?? "", trade: trades[0] ?? "" }), [floors, trades]);
  const state = useBulkRows(WORKPLAN_BULK_COLUMNS, undefined, defaults);
  const [date, setDate] = useState(today);
  const [until, setUntil] = useState("");
  const [skipSun, setSkipSun] = useState("1");
  const [status, setStatus] = useState<Workplan["status"]>(WORKPLAN_BULK_STATUSES[0]);

  const save = async () => {
    const rows = state.rows
      .map((r): BulkRow => ({ ...r, floor: r.floor || defaults.floor, trade: r.trade || defaults.trade }))
      .filter((r) => r.floor && r.trade);
    if (!rows.length) return toast("저장할 줄이 없습니다. 층·구역과 공종을 먼저 선택해 주세요.", "danger");
    const dates = dateRange(date, until || date, { skipSunday: skipSun === "1", limit: 62 });
    if (!dates.length) return toast("작업일자를 선택해 주세요.", "danger");
    if (until && until < date) return toast("반복 종료일은 작업일자보다 빠를 수 없습니다.", "danger");
    const total = rows.length * dates.length;
    const range = dates.length > 1 ? `: ${dates[0]} ~ ${dates[dates.length - 1]}` : "";
    if (!(await confirmDialog({ title: `작업계획서 ${total}건을 저장할까요?`, message: `${rows.length}줄 × ${dates.length}일${range}`, confirmText: "저장" }))) return;
    const inputs: WorkplanInput[] = [];
    dates.forEach((d) =>
      rows.forEach((r) => {
        const title = autoWorkTitle({ title: r.title, floor: r.floor, trade: r.trade });
        inputs.push({
          date: d,
          type: dates.length > 1 ? "주간 작업" : "일일 작업",
          floor: r.floor,
          trade: r.trade,
          title,
          leader: (r.leader ?? "").trim(),
          workers: Math.max(0, Number(r.workers) || 0),
          scope: title,
          status,
        });
      }),
    );
    setBusy(true);
    const res = await createWorkplans(siteId, inputs);
    setBusy(false);
    if (!res.ok) return toast(res.error, "danger");
    await reloadWorkplans(siteId);
    state.reset();
    toast(`작업계획서 ${res.count}건을 저장했습니다.`);
    router.push("/workplan");
  };

  return (
    <Panel>
      <p className="mb-4 text-[13px] text-sub">층·공종별로 여러 줄을 적고 한 번에 저장합니다. 기간을 정하면 날짜마다 반복해서 만들어집니다.</p>
      <FormGrid cols={4}>
        <Field label="작업일자">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="반복 종료일 (선택)">
          <Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
        </Field>
        <Field label="일요일">
          <Select
            value={skipSun}
            onChange={(e) => setSkipSun(e.target.value)}
            options={[
              { value: "1", label: "제외" },
              { value: "0", label: "포함" },
            ]}
          />
        </Field>
        <Field label="계획 상태">
          <Select value={status} onChange={(e) => setStatus(e.target.value as Workplan["status"])} options={[...WORKPLAN_BULK_STATUSES]} />
        </Field>
      </FormGrid>
      <BulkEntryTable columns={WORKPLAN_BULK_COLUMNS} state={state} />
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={() => router.push("/workplan")}>취소</Button>
        <Button variant="primary" onClick={save} disabled={busy}>
          {busy ? "저장 중…" : "모두 저장"}
        </Button>
      </div>
    </Panel>
  );
}
