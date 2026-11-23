"use client";

import { Button, Field, FormGrid, Input, Panel, Select, Textarea, toast } from "@/components/ui";
import type { Risk } from "@/features/risk/types";
import { read, write } from "@/lib/storage/store";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useDraft } from "@/lib/use-draft";
import { useEffect } from "react";
import { ACTION_STATUSES, type Action } from "../types";

const empty = (): Action => ({
  id: "",
  title: "",
  floor: "",
  owner: "",
  due: "",
  control: "",
  status: ACTION_STATUSES[0],
});

export const ACTION_FORM_ID = "action-edit-form";

/** 개선조치 수정 폼 (신규 등록은 위험성평가에서 자동 생성) */
export function ActionForm({ editing, onDone }: { editing: Action | null; onDone: () => void }) {
  const { floors, floorGroups } = useGroupedMasters();
  const form = useDraft(empty);
  const { load, reset, draft } = form;

  useEffect(() => {
    if (editing) load({ ...editing, status: editing.status || "조치대기" });
  }, [editing, load]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const a = read<Action>("actions").slice();
    const idx = a.findIndex((x) => String(x.id) === String(draft.id));
    if (!draft.id || idx < 0) return toast("수정할 개선조치 기록을 찾지 못했습니다. 목록에서 '수정'을 눌러 주세요.", "danger");
    const next: Action = {
      ...a[idx],
      floor: draft.floor || floors[0] || "",
      title: draft.title.trim(),
      owner: draft.owner.trim(),
      due: draft.due,
      status: draft.status,
      control: draft.control.trim(),
    };
    a[idx] = next;
    write("actions", a);
    if (next.riskId) {
      const risks = read<Risk>("risks").slice();
      const ri = risks.findIndex((r) => String(r.id) === String(next.riskId));
      if (ri >= 0) {
        risks[ri] = {
          ...risks[ri],
          floor: next.floor,
          hazard: next.title,
          owner: next.owner,
          due: next.due,
          control: next.control,
          status: next.status,
        };
        write("risks", risks);
      }
    }
    reset();
    onDone();
    toast("개선조치 기록을 수정했습니다.");
  };

  return (
    <Panel
      id={ACTION_FORM_ID}
      className="mt-3"
      title="개선조치 수정"
      description={draft.id ? undefined : "목록에서 '수정'을 누르면 내용을 불러옵니다. 연결된 위험성평가도 함께 수정됩니다."}
    >
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="층·구역">
            <Select groups={floorGroups} {...form.bind("floor")} />
          </Field>
          <Field label="개선조치 제목" required>
            <Input required {...form.bind("title")} />
          </Field>
          <Field label="담당자">
            <Input {...form.bind("owner")} />
          </Field>
          <Field label="조치기한">
            <Input type="date" {...form.bind("due")} />
          </Field>
          <Field label="상태">
            <Select options={[...ACTION_STATUSES]} {...form.bind("status")} />
          </Field>
        </FormGrid>
        <Field label="개선대책">
          <Textarea {...form.bind("control")} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary">
            {draft.id ? "수정 내용 저장" : "개선조치 저장"}
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
