"use client";

import { BulkEntryTable, useBulkRows, type BulkRow } from "@/components/data";
import { Button, Disclosure, Field, FormGrid, Input, toast, confirmDialog } from "@/components/ui";
import { autoWorkTitle, useWorkplans } from "@/features/workplan";
import { nowISO, today } from "@/lib/date";
import { newId } from "@/lib/id";
import { useCollection } from "@/lib/storage/hooks";
import { useGroupedMasters } from "@/lib/storage/masters";
import { read } from "@/lib/storage/store";
import { useMemo, useState } from "react";
import { WORKDIARY_BULK_COLUMNS } from "../lib";
import { emptyPhotos, type WorkDiary } from "../types";

/** 원본 BULK.wd: 그날 작업계획서를 불러오거나 여러 줄을 적어 작업일보 한 번에 등록 */
export function WorkDiaryBulk() {
  const { addMany } = useCollection<WorkDiary>("workdiaries");
  const plansAll = useWorkplans().items ?? [];
  const { floors, trades } = useGroupedMasters();
  const defaults = useMemo(() => ({ floor: floors[0] ?? "", trade: trades[0] ?? "" }), [floors, trades]);
  const state = useBulkRows(WORKDIARY_BULK_COLUMNS, undefined, defaults);
  const [date, setDate] = useState(today);

  const loadPlans = () => {
    const plans = plansAll.filter((x) => x.date === date);
    if (!plans.length) return toast(`${date} 작업계획서가 없습니다. 날짜를 확인해 주세요.`, "danger");
    const done = new Set(
      read<WorkDiary>("workdiaries")
        .filter((x) => x.date === date && x.planId)
        .map((x) => x.planId),
    );
    const todo = plans.filter((p) => !done.has(p.id));
    if (!todo.length) return toast("이 날짜 작업계획서는 모두 작업일보로 등록되어 있습니다.", "danger");
    state.reset(
      todo.map((p) => ({
        planId: p.id,
        floor: p.floor,
        trade: p.trade,
        title: p.title,
        actualWorkers: String(Number(p.workers) || 0),
        progress: "0",
        actual: "",
      })),
    );
    toast(
      `작업계획서 ${todo.length}건을 불러왔습니다. 실제 인원과 진행률만 고친 뒤 '모두 저장'을 누르세요.` +
        (done.size ? `\n(이미 작업일보가 있는 ${done.size}건은 제외)` : ""),
    );
  };

  const save = async () => {
    const rows = state.rows
      .map((r): BulkRow => ({ ...r, floor: r.floor || defaults.floor, trade: r.trade || defaults.trade }))
      .filter((r) => r.floor && r.trade);
    if (!rows.length) return toast("저장할 줄이 없습니다. 층·구역과 공종을 먼저 선택해 주세요.", "danger");
    if (!date) return toast("작업일자를 선택해 주세요.", "danger");
    if (!(await confirmDialog({ title: `작업일보 ${rows.length}건을 저장할까요?`, message: `${date} 작업일보`, confirmText: "저장" }))) return;
    const plans = plansAll;
    const now = nowISO();
    const created: WorkDiary[] = [];
    rows.forEach((r) => {
      const p = plans.find((x) => x.id === r.planId);
      const title = autoWorkTitle({ title: r.title, floor: r.floor, trade: r.trade });
      created.unshift({
        id: newId(),
        planId: r.planId || "",
        date,
        floor: r.floor,
        trade: r.trade,
        title,
        leader: p?.leader || "",
        plannedWorkers: Number(p?.workers) || 0,
        actualWorkers: Math.max(0, Number(r.actualWorkers) || 0),
        start: "",
        end: "",
        progress: Number(r.progress) || 0,
        equipment: p?.equipment || "",
        actual: (r.actual ?? "").trim() || title,
        issues: "",
        safety: "",
        incident: "없음",
        confirmedBy: "",
        photos: emptyPhotos(),
        updatedAt: now,
      });
    });
    addMany(created);
    state.reset();
    toast(`작업일보 ${rows.length}건을 저장했습니다.`);
  };

  return (
    <Disclosure
      title="여러 건 한 번에 등록"
      description="그날 작업계획서를 불러오거나 여러 줄을 적어 작업일보를 한 번에 저장합니다."
    >
      <FormGrid cols={4}>
        <Field label="작업일자">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div className="mb-4 flex items-end sm:col-span-1 lg:col-span-3">
          <Button onClick={loadPlans}>이 날짜 작업계획서 불러오기</Button>
        </div>
      </FormGrid>
      <BulkEntryTable columns={WORKDIARY_BULK_COLUMNS} state={state} />
      <div className="mt-3 flex justify-end">
        <Button variant="primary" onClick={save}>
          모두 저장
        </Button>
      </div>
    </Disclosure>
  );
}
