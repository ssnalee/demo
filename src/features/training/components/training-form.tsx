"use client";

import { Button, Checkbox, Field, FormGrid, Input, Panel, Select, Textarea, toast } from "@/components/ui";
import { newId } from "@/lib/id";
import { useCollection } from "@/lib/storage/hooks";
import { useDraft } from "@/lib/use-draft";
import { useEffect } from "react";
import { TRAINING_TYPES, parseAttendees, type Training } from "../types";

type Draft = Omit<Training, "attendees" | "count"> & { attendeesText: string; count: number | string };

const empty = (): Draft => ({
  id: "",
  type: TRAINING_TYPES[0],
  date: "",
  title: "",
  instructor: "",
  content: "",
  count: 0,
  attendeesText: "",
  attendanceChecked: false,
});

export const TRAINING_FORM_ID = "training-form";

export function TrainingForm({ editing, onDone }: { editing: Training | null; onDone: () => void }) {
  const { upsert } = useCollection<Training>("trainings");
  const form = useDraft(empty);
  const { load, reset, draft } = form;

  useEffect(() => {
    if (!editing) return;
    const { attendees, ...rest } = editing;
    load({ ...rest, attendeesText: (attendees || []).join(", "), attendanceChecked: !!editing.attendanceChecked });
  }, [editing, load]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const { attendeesText, ...rest } = draft;
    const item: Training = {
      ...rest,
      id: draft.id || newId(),
      count: Number(draft.count) || 0,
      attendees: parseAttendees(attendeesText),
    };
    const updated = upsert(item);
    reset();
    onDone();
    toast(
      updated
        ? "교육기록을 수정했습니다."
        : "교육기록과 참석자 명단을 저장했습니다. 서명 원본이나 법정교육 이수증빙은 별도로 보관해야 합니다.",
    );
  };

  return (
    <Panel id={TRAINING_FORM_ID}>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="교육 유형">
            <Select options={[...TRAINING_TYPES]} {...form.bind("type")} />
          </Field>
          <Field label="교육일시" required>
            <Input type="datetime-local" required {...form.bind("date")} />
          </Field>
          <Field label="교육명" required>
            <Input required {...form.bind("title")} />
          </Field>
          <Field label="교육자">
            <Input {...form.bind("instructor")} />
          </Field>
        </FormGrid>
        <Field label="교육내용">
          <Textarea {...form.bind("content")} />
        </Field>
        <FormGrid>
          <Field label="참석인원">
            <Input type="number" min={0} {...form.bind("count")} />
          </Field>
        </FormGrid>
        <Field label="참석자 명단" hint={`입력된 명단: ${parseAttendees(draft.attendeesText).length}명`}>
          <Textarea placeholder="성명을 쉼표 또는 줄바꿈으로 구분" {...form.bind("attendeesText")} />
        </Field>
        <div className="mb-4">
          <Checkbox label="참석자 명단 및 실제 참석 여부 확인" {...form.bindCheck("attendanceChecked")} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary">
            {draft.id ? "수정 내용 저장" : "교육기록 저장"}
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
