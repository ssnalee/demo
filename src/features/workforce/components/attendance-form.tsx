"use client";

import { Button, Field, FormGrid, Input, Panel, Select, toast, confirmDialog } from "@/components/ui";
import { today } from "@/lib/date";
import { newId } from "@/lib/id";
import { useCollection } from "@/lib/storage/hooks";
import { useGroupedMasters } from "@/lib/storage/masters";
import { read } from "@/lib/storage/store";
import { useDraft } from "@/lib/use-draft";
import { ATTENDANCE_STATUSES, WORKER_INACTIVE, type Attendance, type Worker } from "../types";

const empty = () => ({
  date: today(),
  workerId: "",
  floor: "",
  trade: "",
  inTime: "",
  outTime: "",
  status: ATTENDANCE_STATUSES[0] as string,
});

export function AttendanceForm() {
  const { items: workers } = useCollection<Worker>("workers");
  const { upsert } = useCollection<Attendance>("attendance");
  const { floors, trades, floorGroups, tradeGroups } = useGroupedMasters();
  const form = useDraft(empty);
  const active = workers.filter((x) => x.status !== WORKER_INACTIVE);
  const workerId = active.some((w) => w.id === form.draft.workerId) ? form.draft.workerId : (active[0]?.id ?? "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const worker = workers.find((x) => x.id === workerId);
    if (!worker) return toast("먼저 근로자를 등록해 주세요.", "danger");
    const d = form.draft;
    if (
      read<Attendance>("attendance").some((x) => x.workerId === worker.id && x.date === d.date) &&
      !(await confirmDialog({ title: "같은 날짜의 출역기록이 있습니다", message: "추가로 등록할까요?", confirmText: "추가 등록" }))
    )
      return;
    upsert({
      id: newId(),
      date: d.date,
      workerId: worker.id,
      workerName: worker.name,
      company: worker.company,
      dailyWage: Number(worker.dailyWage) || 0,
      floor: d.floor || floors[0] || "",
      trade: d.trade || trades[0] || "",
      inTime: d.inTime,
      outTime: d.outTime,
      status: d.status,
    });
    toast("출역기록을 저장했습니다.");
  };

  return (
    <Panel title="일일 출역 등록" className="mt-0">
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="출역일자" required>
            <Input type="date" required {...form.bind("date")} />
          </Field>
          <Field label="근로자" required>
            <Select
              required
              value={workerId}
              onChange={(e) => form.set("workerId", e.target.value)}
              options={active.map((x) => ({ value: x.id, label: `${x.name} · ${x.company || "소속 미기재"}` }))}
            >
              {!active.length && <option value="">재직 중인 근로자가 없습니다</option>}
            </Select>
          </Field>
          <Field label="작업 층·구역">
            <Select groups={floorGroups} {...form.bind("floor")} />
          </Field>
          <Field label="공종">
            <Select groups={tradeGroups} {...form.bind("trade")} />
          </Field>
          <Field label="출근시간">
            <Input type="time" {...form.bind("inTime")} />
          </Field>
          <Field label="퇴근시간">
            <Input type="time" {...form.bind("outTime")} />
          </Field>
          <Field label="출역상태">
            <Select options={[...ATTENDANCE_STATUSES]} {...form.bind("status")} />
          </Field>
        </FormGrid>
        <Button type="submit" variant="primary">
          출역기록 저장
        </Button>
      </form>
    </Panel>
  );
}
