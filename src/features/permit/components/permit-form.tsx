"use client";

import { Button, Field, FormGrid, Input, Panel, Select, Textarea, toast } from "@/components/ui";
import { newId } from "@/lib/id";
import { read, write } from "@/lib/storage/store";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useDraft } from "@/lib/use-draft";
import { useEffect } from "react";
import { PERMIT_TYPES, type Permit } from "../types";

const empty = (): Permit => ({
  id: "",
  type: PERMIT_TYPES[0],
  floor: "",
  start: "",
  end: "",
  note: "",
  applicant: "",
  status: "",
});

export const PERMIT_FORM_ID = "permit-form";

export function PermitForm({ editing, onDone }: { editing: Permit | null; onDone: () => void }) {
  const { floors, floorGroups } = useGroupedMasters();
  const form = useDraft(empty);
  const { load, reset, draft } = form;

  useEffect(() => {
    if (editing) load(editing);
  }, [editing, load]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(draft.end) <= new Date(draft.start)) return toast("종료시간은 시작시간 이후여야 합니다.", "danger");
    const a = read<Permit>("permits").slice();
    const id = draft.id || newId();
    const idx = a.findIndex((x) => String(x.id) === String(id));
    const old: Partial<Permit> = idx >= 0 ? a[idx] : {};
    const item: Permit = {
      ...old,
      id,
      type: draft.type,
      floor: draft.floor || floors[0] || "",
      start: draft.start,
      end: draft.end,
      note: draft.note,
      applicant: draft.applicant,
      status: old.status || "신청",
    };
    if (idx >= 0) a[idx] = item;
    else a.unshift(item);
    write("permits", a);
    reset();
    onDone();
    toast(
      idx >= 0
        ? "작업허가 기록을 수정했습니다."
        : "허가 신청을 등록했습니다. 실제 작업허가 승인은 권한 있는 책임자의 확인이 별도로 필요합니다.",
    );
  };

  return (
    <Panel id={PERMIT_FORM_ID}>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="허가 종류">
            <Select options={[...PERMIT_TYPES]} {...form.bind("type")} />
          </Field>
          <Field label="작업 층·구역">
            <Select groups={floorGroups} {...form.bind("floor")} />
          </Field>
          <Field label="작업 시작" required>
            <Input type="datetime-local" required {...form.bind("start")} />
          </Field>
          <Field label="작업 종료" required>
            <Input type="datetime-local" required {...form.bind("end")} />
          </Field>
        </FormGrid>
        <Field label="작업내용 및 필수 안전조치" required>
          <Textarea required {...form.bind("note")} />
        </Field>
        <Field label="신청자" required>
          <Input required {...form.bind("applicant")} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary">
            {draft.id ? "수정 내용 저장" : "허가 신청 등록"}
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
