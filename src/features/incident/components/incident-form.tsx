"use client";

import { Button, Field, FormGrid, Input, Panel, Select, Textarea, toast } from "@/components/ui";
import { today } from "@/lib/date";
import { newId } from "@/lib/id";
import { useCollection } from "@/lib/storage/hooks";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useDraft } from "@/lib/use-draft";
import { useEffect } from "react";
import { INCIDENT_TYPES, type Incident } from "../types";

const nowLocal = () => today() + "T" + new Date().toTimeString().slice(0, 5);

const empty = (): Incident => ({
  id: "",
  type: INCIDENT_TYPES[0],
  date: nowLocal(),
  floor: "",
  reporter: "",
  narrative: "",
  action: "",
});

export const INCIDENT_FORM_ID = "incident-form";

export function IncidentForm({ editing, onDone }: { editing: Incident | null; onDone: () => void }) {
  const { upsert } = useCollection<Incident>("incidents");
  const { floors, floorGroups } = useGroupedMasters();
  const form = useDraft(empty);
  const { load, reset } = form;

  useEffect(() => {
    if (editing) load(editing);
  }, [editing, load]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = form.draft;
    const item: Incident = {
      id: d.id || newId(),
      type: d.type,
      date: d.date,
      floor: d.floor || floors[0] || "",
      reporter: d.reporter,
      narrative: d.narrative,
      action: d.action,
    };
    const updated = upsert(item);
    reset();
    onDone();
    toast(updated ? "사고·아차사고 기록을 수정했습니다." : "사고·아차사고 기록을 저장했습니다.");
  };

  return (
    <Panel id={INCIDENT_FORM_ID}>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="유형">
            <Select options={[...INCIDENT_TYPES]} {...form.bind("type")} />
          </Field>
          <Field label="발생 일시" required>
            <Input type="datetime-local" required {...form.bind("date")} />
          </Field>
          <Field label="발생 층·구역">
            <Select groups={floorGroups} {...form.bind("floor")} />
          </Field>
          <Field label="보고자" required>
            <Input required {...form.bind("reporter")} />
          </Field>
        </FormGrid>
        <Field label="발생 상황 및 위험내용" required>
          <Textarea required {...form.bind("narrative")} />
        </Field>
        <Field label="즉시조치 및 재발방지 대책">
          <Textarea {...form.bind("action")} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary">
            {form.draft.id ? "수정 내용 저장" : "사고·아차사고 등록"}
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
