"use client";

import { Button, Field, FormGrid, Input, Panel, Select, toast } from "@/components/ui";
import { newId } from "@/lib/id";
import { useCollection } from "@/lib/storage/hooks";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useDraft } from "@/lib/use-draft";
import { useEffect } from "react";
import { WORKER_STATUSES, type Worker } from "../types";

type Draft = Omit<Worker, "dailyWage"> & { dailyWage: number | string };

const empty = (): Draft => ({
  id: "",
  name: "",
  company: "",
  trade: "",
  phone: "",
  dailyWage: "",
  status: WORKER_STATUSES[0],
});

export const WORKER_FORM_ID = "worker-form";

export function WorkerForm({ editing, onDone }: { editing: Worker | null; onDone: () => void }) {
  const { upsert, get } = useCollection<Worker>("workers");
  const { trades, tradeGroups } = useGroupedMasters();
  const form = useDraft<Draft>(empty);
  const { load, reset } = form;

  useEffect(() => {
    if (editing)
      load({
        ...editing,
        company: editing.company || "",
        trade: editing.trade || "",
        phone: editing.phone || "",
        dailyWage: editing.dailyWage ?? "",
        status: editing.status || WORKER_STATUSES[0],
      });
  }, [editing, load]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = form.draft;
    const id = d.id || newId();
    const item: Worker = {
      ...(get(id) ?? {}),
      id,
      name: d.name.trim(),
      company: d.company.trim(),
      trade: d.trade || trades[0] || "",
      phone: d.phone.trim(),
      dailyWage: Math.max(0, Number(d.dailyWage) || 0),
      status: d.status,
    };
    upsert(item);
    reset();
    onDone();
    toast("근로자 정보를 저장했습니다.");
  };

  return (
    <Panel id={WORKER_FORM_ID} title={form.draft.id ? "근로자 정보 수정" : "근로자 등록"} className="mt-0">
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="성명" required>
            <Input required {...form.bind("name")} />
          </Field>
          <Field label="소속업체">
            <Input list="company-names" placeholder="원도급·협력업체명" {...form.bind("company")} />
          </Field>
          <Field label="직종·공종">
            <Select groups={tradeGroups} {...form.bind("trade")} />
          </Field>
          <Field label="연락처(선택)">
            <Input type="tel" {...form.bind("phone")} />
          </Field>
          <Field label="1일 노임(원)">
            <Input type="number" min={0} step={1000} placeholder="예: 250000" {...form.bind("dailyWage")} />
          </Field>
          <Field label="등록 상태">
            <Select options={[...WORKER_STATUSES]} {...form.bind("status")} />
          </Field>
        </FormGrid>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary">
            근로자 저장
          </Button>
          <Button
            onClick={() => {
              reset();
              onDone();
            }}
          >
            취소
          </Button>
        </div>
      </form>
    </Panel>
  );
}
