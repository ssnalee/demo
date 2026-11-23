"use client";

import { Button, Field, FormGrid, Input, Panel, Select, Textarea, toast } from "@/components/ui";
import { today } from "@/lib/date";
import { newId } from "@/lib/id";
import { useCollection } from "@/lib/storage/hooks";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useDraft } from "@/lib/use-draft";
import { useEffect } from "react";
import { INSPECTION_ITEMS, INSPECTION_RESULTS, INSPECTION_TYPES, type Inspection } from "../types";

const empty = (): Inspection => ({
  id: "",
  date: today(),
  type: INSPECTION_TYPES[0],
  floor: "",
  inspector: "",
  item: INSPECTION_ITEMS[0],
  result: INSPECTION_RESULTS[0],
  note: "",
});

export const INSPECTION_FORM_ID = "inspection-form";

/** editing: 수정할 기록 (없으면 신규 등록) */
export function InspectionForm({ editing, onDone }: { editing: Inspection | null; onDone: () => void }) {
  const { upsert } = useCollection<Inspection>("inspections");
  const { floors, floorGroups } = useGroupedMasters();
  const form = useDraft(empty);
  const { load, reset } = form;

  useEffect(() => {
    if (editing) load(editing);
  }, [editing, load]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const item: Inspection = { ...form.draft, id: form.draft.id || newId(), floor: form.draft.floor || floors[0] || "" };
    const updated = upsert(item);
    reset();
    onDone();
    toast(updated ? "점검기록을 수정했습니다." : "점검기록을 저장했습니다.");
  };

  return (
    <Panel id={INSPECTION_FORM_ID}>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="점검일자" required>
            <Input type="date" required {...form.bind("date")} />
          </Field>
          <Field label="점검 유형">
            <Select options={[...INSPECTION_TYPES]} {...form.bind("type")} />
          </Field>
          <Field label="점검 층·구역">
            <Select groups={floorGroups} {...form.bind("floor")} />
          </Field>
          <Field label="점검자" required>
            <Input required placeholder="점검자 성명" {...form.bind("inspector")} />
          </Field>
          <Field label="점검 항목">
            <Select options={[...INSPECTION_ITEMS]} {...form.bind("item")} />
          </Field>
          <Field label="점검 결과">
            <Select options={[...INSPECTION_RESULTS]} {...form.bind("result")} />
          </Field>
        </FormGrid>
        <Field label="점검내용 및 지적사항">
          <Textarea placeholder="부적합 시 구체적인 위치·상태·위험을 기록" {...form.bind("note")} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary">
            {form.draft.id ? "수정 내용 저장" : "점검 결과 저장"}
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
