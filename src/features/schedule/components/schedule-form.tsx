"use client";

import { Button, Field, FormGrid, Input, Panel, Select, Textarea, toast } from "@/components/ui";
import { nowISO, today } from "@/lib/date";
import { newId } from "@/lib/id";
import { useCollection } from "@/lib/storage/hooks";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useDraft } from "@/lib/use-draft";
import { useEffect } from "react";
import { SCHEDULE_CATEGORIES, SCHEDULE_PRIORITIES, SCHEDULE_STATUSES, type Schedule } from "../types";

const empty = (): Schedule => ({
  id: "",
  title: "",
  category: SCHEDULE_CATEGORIES[0],
  start: today(),
  end: "",
  time: "",
  endTime: "",
  priority: SCHEDULE_PRIORITIES[0],
  status: SCHEDULE_STATUSES[0],
  owner: "",
  company: "",
  floor: "",
  location: "",
  content: "",
  result: "",
});

export const SCHEDULE_FORM_ID = "schedule-form";

export function ScheduleForm({ editing, onDone }: { editing: Schedule | null; onDone: () => void }) {
  const { upsert } = useCollection<Schedule>("schedules");
  const { floors, floorGroups } = useGroupedMasters();
  const form = useDraft(empty);
  const { draft, load, reset } = form;

  useEffect(() => {
    if (editing) load(editing);
  }, [editing, load]);

  const cancel = () => {
    reset();
    onDone();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.end && draft.end < draft.start) return toast("종료일은 시작일보다 빠를 수 없습니다.", "danger");
    const t = (s: string) => (s || "").trim();
    const item: Schedule = {
      id: draft.id || newId(),
      title: t(draft.title),
      category: draft.category,
      start: draft.start,
      end: draft.end,
      time: draft.time,
      endTime: draft.endTime,
      priority: draft.priority,
      status: draft.status,
      owner: t(draft.owner),
      company: t(draft.company),
      floor: draft.floor || floors[0] || "",
      location: t(draft.location),
      content: t(draft.content),
      result: t(draft.result),
      updatedAt: nowISO(),
    };
    const updated = upsert(item);
    cancel();
    toast(updated ? "일정을 수정했습니다." : "일정을 등록했습니다.");
  };

  return (
    <Panel id={SCHEDULE_FORM_ID} title={draft.id ? "일정 수정" : "일정 등록"}>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="일정명" required>
            <Input required placeholder="예: 소방 완공검사" {...form.bind("title")} />
          </Field>
          <Field label="일정 구분">
            <Select options={[...SCHEDULE_CATEGORIES]} {...form.bind("category")} />
          </Field>
          <Field label="시작일" required>
            <Input type="date" required {...form.bind("start")} />
          </Field>
          <Field label="종료일">
            <Input type="date" {...form.bind("end")} />
          </Field>
          <Field label="시작 시간">
            <Input type="time" {...form.bind("time")} />
          </Field>
          <Field label="종료 시간">
            <Input type="time" {...form.bind("endTime")} />
          </Field>
          <Field label="중요도">
            <Select options={[...SCHEDULE_PRIORITIES]} {...form.bind("priority")} />
          </Field>
          <Field label="진행 상태">
            <Select options={[...SCHEDULE_STATUSES]} {...form.bind("status")} />
          </Field>
          <Field label="담당자">
            <Input placeholder="책임자 또는 담당자" {...form.bind("owner")} />
          </Field>
          <Field label="담당 업체">
            <Input list="company-names" placeholder="업체명" {...form.bind("company")} />
          </Field>
          <Field label="층·구역">
            <Select groups={floorGroups} {...form.bind("floor")} />
          </Field>
          <Field label="장소">
            <Input placeholder="현장 또는 회의 장소" {...form.bind("location")} />
          </Field>
        </FormGrid>
        <Field label="상세 내용 및 준비사항">
          <Textarea placeholder="일정 목적, 사전 준비사항, 제출서류 등을 기록하세요." {...form.bind("content")} />
        </Field>
        <Field label="완료 확인 및 결과">
          <Textarea rows={2} placeholder="완료 내용, 결과, 후속 조치 등을 기록하세요." {...form.bind("result")} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary">
            {draft.id ? "수정 내용 저장" : "일정 저장"}
          </Button>
          <Button onClick={cancel}>취소</Button>
        </div>
      </form>
    </Panel>
  );
}
