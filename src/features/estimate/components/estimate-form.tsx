"use client";

import { Button, Field, FormGrid, Input, Panel, Select, toast } from "@/components/ui";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useDraft } from "@/lib/use-draft";
import { useEffect } from "react";
import { saveEstimateForm } from "../lib/store";

export const ESTIMATE_FORM_ID = "estimate-form";

interface Draft {
  id: string;
  trade: string;
  title: string;
  quote: number | "";
  cost: number | "";
  note: string;
}

const empty = (): Draft => ({ id: "", trade: "", title: "", quote: "", cost: "", note: "" });

export function EstimateForm({ editing, onDone }: { editing: Draft | null; onDone: () => void }) {
  const { trades, tradeGroups } = useGroupedMasters();
  const form = useDraft(empty);
  const { load, reset } = form;

  useEffect(() => {
    if (editing) load(editing);
  }, [editing, load]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = form.draft;
    const updated = saveEstimateForm({
      id: d.id,
      trade: d.trade || trades[0] || "",
      title: d.title.trim(),
      quote: Math.max(0, Number(d.quote) || 0),
      cost: Math.max(0, Number(d.cost) || 0),
      note: d.note.trim(),
    });
    reset();
    onDone();
    toast(updated ? "견적·실행 항목을 수정했습니다." : "견적·실행 항목을 저장했습니다.");
  };

  return (
    <Panel id={ESTIMATE_FORM_ID} title={form.draft.id ? "견적·실행 항목 수정" : "견적·실행 항목 등록"}>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="공종" required>
            <Select required groups={tradeGroups} {...form.bind("trade")} />
          </Field>
          <Field label="세부 항목명">
            <Input placeholder="예: 전등 및 배선 공사" {...form.bind("title")} />
          </Field>
          <Field label="견적금액(원, 부가세 별도)" required>
            <Input type="number" min={0} step={1} required placeholder="10000000" {...form.bind("quote")} />
          </Field>
          <Field label="실행금액(원, 부가세 별도)" required>
            <Input type="number" min={0} step={1} required placeholder="9000000" {...form.bind("cost")} />
          </Field>
          <Field label="비고">
            <Input placeholder="업체명, 계약조건 등" {...form.bind("note")} />
          </Field>
        </FormGrid>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary">
            저장
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

export type EstimateDraft = Draft;
