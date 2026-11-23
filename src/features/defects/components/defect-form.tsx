"use client";

import { Button, Field, FormGrid, Input, Muted, Panel, PhotoInput, Select, Textarea, toast } from "@/components/ui";
import { nowISO, today } from "@/lib/date";
import { newId } from "@/lib/id";
import { useCollection } from "@/lib/storage/hooks";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useDraft } from "@/lib/use-draft";
import { useEffect } from "react";
import { DEFECT_STATUSES, DEFECT_TYPES, type Defect } from "../types";

type Draft = Omit<Defect, "photos"> & { before: string; after: string };

const empty = (): Draft => ({
  id: "",
  date: today(),
  floor: "",
  trade: "",
  location: "",
  type: DEFECT_TYPES[0],
  company: "",
  contact: "",
  planDate: "",
  doneDate: "",
  status: DEFECT_STATUSES[0],
  content: "",
  action: "",
  note: "",
  before: "",
  after: "",
});

export const DEFECT_FORM_ID = "defect-form";

export function DefectForm({ editing, onDone }: { editing: Defect | null; onDone: () => void }) {
  const { upsert } = useCollection<Defect>("defects");
  const { floors, trades, floorGroups, tradeGroups } = useGroupedMasters();
  const form = useDraft(empty);
  const { load, reset, set, draft } = form;

  useEffect(() => {
    if (!editing) return;
    const { photos, ...rest } = editing;
    load({ ...rest, before: photos?.before || "", after: photos?.after || "" });
  }, [editing, load]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.content.trim()) return toast("하자 내용을 입력해 주세요.", "danger");
    const d = draft;
    const item: Defect = {
      id: d.id || newId(),
      date: d.date,
      floor: d.floor || floors[0] || "",
      trade: d.trade || trades[0] || "",
      location: d.location.trim(),
      type: d.type,
      company: d.company.trim(),
      contact: d.contact.trim(),
      planDate: d.planDate,
      doneDate: d.doneDate,
      status: d.status,
      content: d.content.trim(),
      action: d.action.trim(),
      note: d.note.trim(),
      photos: { before: d.before, after: d.after },
      updatedAt: nowISO(),
    };
    const updated = upsert(item);
    reset();
    onDone();
    toast(updated ? "하자보수 기록을 수정했습니다." : "하자 접수 내용을 저장했습니다.");
  };

  return (
    <Panel id={DEFECT_FORM_ID} className="mt-3" title={draft.id ? "하자보수 기록 수정" : "하자 접수 등록"}>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="하자 접수일" required>
            <Input type="date" required {...form.bind("date")} />
          </Field>
          <Field label="발생 층·구역">
            <Select groups={floorGroups} {...form.bind("floor")} />
          </Field>
          <Field label="공종">
            <Select groups={tradeGroups} {...form.bind("trade")} />
          </Field>
          <Field label="발생 위치">
            <Input placeholder="예: 302호 화장실 천장" {...form.bind("location")} />
          </Field>
          <Field label="하자 유형">
            <Select options={[...DEFECT_TYPES]} {...form.bind("type")} />
          </Field>
          <Field label="보수 담당업체">
            <Input list="company-names" placeholder="업체명" {...form.bind("company")} />
          </Field>
          <Field label="담당자·연락처">
            <Input placeholder="성명 / 연락처" {...form.bind("contact")} />
          </Field>
          <Field label="보수 예정일">
            <Input type="date" {...form.bind("planDate")} />
          </Field>
          <Field label="실제 보수일">
            <Input type="date" {...form.bind("doneDate")} />
          </Field>
          <Field label="진행 상태">
            <Select options={[...DEFECT_STATUSES]} {...form.bind("status")} />
          </Field>
        </FormGrid>
        <Field label="하자 내용" required>
          <Textarea required placeholder="하자 발생 상태와 확인 내용을 기록하세요." {...form.bind("content")} />
        </Field>
        <Field label="보수 내용 및 조치 결과">
          <Textarea placeholder="보수 방법, 완료 확인 내용 등을 기록하세요." {...form.bind("action")} />
        </Field>
        <Panel inset title="하자 사진" className="mt-0 mb-4">
          <Muted className="mb-3">
            휴대폰에서는 사진 찍기 또는 앨범 선택이 가능합니다. 사진은 자동으로 축소·압축되어 저장되며, 사진을 누르면 크게 볼 수
            있습니다.
          </Muted>
          <FormGrid>
            <PhotoInput label="하자 발생 사진" value={draft.before} onChange={(v) => set("before", v)} />
            <PhotoInput label="보수 완료 사진" value={draft.after} onChange={(v) => set("after", v)} />
          </FormGrid>
        </Panel>
        <Field label="비고">
          <Textarea rows={2} {...form.bind("note")} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary">
            {draft.id ? "수정 내용 저장" : "하자 접수 저장"}
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
