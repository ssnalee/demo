"use client";

import { Button, Checkbox, Field, FormGrid, Input, Muted, Panel, PhotoInput, Select, Textarea, toast } from "@/components/ui";
import { useWorkplans } from "@/features/workplan";
import { nowISO, today } from "@/lib/date";
import { newId } from "@/lib/id";
import { useCollection } from "@/lib/storage/hooks";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useDraft } from "@/lib/use-draft";
import { useMemo, useState } from "react";
import { PHOTO_STAGES, WORKDIARY_INCIDENTS, emptyPhotos, type WorkDiary } from "../types";

const empty = (): WorkDiary => ({
  id: "",
  planId: "",
  date: today(),
  floor: "",
  trade: "",
  title: "",
  leader: "",
  plannedWorkers: 0,
  actualWorkers: 0,
  start: "",
  end: "",
  progress: 0,
  equipment: "",
  actual: "",
  issues: "",
  safety: "",
  incident: WORKDIARY_INCIDENTS[0],
  confirmedBy: "",
  photos: emptyPhotos(),
});

export const WORKDIARY_FORM_ID = "workdiary-form";

export type WorkDiaryFormRequest = { seq: number } & ({ kind: "new" } | { kind: "edit" | "copy"; item: WorkDiary });

type Mode = "new" | "edit" | "copy" | "keep";
const TITLES: Record<Mode, string> = {
  new: "작업일보 등록",
  edit: "작업일보 수정",
  copy: "작업일보 등록 (복사본 · 날짜 확인 후 저장)",
  keep: "작업일보 등록 (연속 입력 중)",
};

export function WorkDiaryForm({ request }: { request: WorkDiaryFormRequest | null }) {
  const { upsert } = useCollection<WorkDiary>("workdiaries");
  const planItems = useWorkplans().items;
  const plans = useMemo(() => planItems ?? [], [planItems]);
  const { floors, trades, floorGroups, tradeGroups } = useGroupedMasters();
  const form = useDraft(empty);
  const { load, reset, set, setDraft } = form;
  const [mode, setMode] = useState<Mode>("new");
  const [keep, setKeep] = useState(false);

  const planOptions = useMemo(
    () =>
      plans
        .slice()
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .map((p) => ({ value: p.id, label: `${p.date} · ${p.floor} · ${p.title}` })),
    [plans],
  );

  // 요청이 바뀌면 렌더링 중에 폼 상태를 맞춤 (effect 대신)
  const [seen, setSeen] = useState(request);
  if (request !== seen) {
    setSeen(request);
    if (request) applyRequest(request);
  }

  function applyRequest(request: NonNullable<typeof seen>) {
    if (request.kind === "new") {
      reset();
      setMode("new");
      return;
    }
    const x = request.item;
    // 원본처럼 삭제된 계획서에 연결돼 있으면 연결을 비움
    const planId = x.planId && plans.some((p) => p.id === x.planId) ? x.planId : "";
    const photos = { before: x.photos?.before || "", during: x.photos?.during || "", after: x.photos?.after || "" };
    if (request.kind === "edit") {
      load({ ...x, planId, photos });
      setMode("edit");
    } else {
      load({ ...x, planId, id: "", date: today(), photos: emptyPhotos() });
      setMode("copy");
    }
  }

  /** 원본 applyWorkPlanToDiary: 연결한 계획서의 내용을 채움 */
  const applyPlan = (planId: string) => {
    const p = plans.find((x) => x.id === planId);
    setDraft((d) =>
      p
        ? {
            ...d,
            planId,
            date: p.date || d.date,
            floor: p.floor || floors[0] || "",
            trade: p.trade || trades[0] || "",
            title: p.title || "",
            leader: p.leader || "",
            plannedWorkers: Number(p.workers) || 0,
            equipment: p.equipment || "",
          }
        : { ...d, planId },
    );
  };

  const cancel = () => {
    reset();
    setMode("new");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = form.draft;
    const item: WorkDiary = {
      id: d.id || newId(),
      planId: d.planId,
      date: d.date,
      floor: d.floor || floors[0] || "",
      trade: d.trade || trades[0] || "",
      title: d.title,
      leader: d.leader,
      plannedWorkers: Number(d.plannedWorkers) || 0,
      actualWorkers: Number(d.actualWorkers) || 0,
      start: d.start,
      end: d.end,
      progress: Math.max(0, Math.min(100, Number(d.progress) || 0)),
      equipment: d.equipment,
      actual: d.actual,
      issues: d.issues,
      safety: d.safety,
      incident: d.incident,
      confirmedBy: d.confirmedBy,
      photos: { ...d.photos },
      updatedAt: nowISO(),
    };
    const updated = upsert(item);
    if (keep) {
      setDraft((x) => ({ ...x, id: "", photos: emptyPhotos() }));
      setMode("keep");
    } else cancel();
    toast(updated ? "작업일보를 수정했습니다." : "작업일보를 저장했습니다.");
  };

  return (
    <Panel id={WORKDIARY_FORM_ID} title={TITLES[mode]}>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="작업일자" required>
            <Input type="date" required {...form.bind("date")} />
          </Field>
          <Field label="연결 작업계획서">
            <Select
              placeholder="계획서 연결 안 함"
              options={planOptions}
              value={form.draft.planId}
              onChange={(e) => applyPlan(e.target.value)}
            />
          </Field>
          <Field label="작업 층·구역" required>
            <Select groups={floorGroups} {...form.bind("floor")} />
          </Field>
          <Field label="공종" required>
            <Select groups={tradeGroups} {...form.bind("trade")} />
          </Field>
          <Field label="작업명" required>
            <Input required placeholder="예: 지하 2층 천장 텍스 철거" {...form.bind("title")} />
          </Field>
          <Field label="작업책임자·반장">
            <Input placeholder="성명 또는 직책" {...form.bind("leader")} />
          </Field>
          <Field label="계획 인원">
            <Input type="number" min={0} {...form.bind("plannedWorkers")} />
          </Field>
          <Field label="실제 투입 인원">
            <Input type="number" min={0} required {...form.bind("actualWorkers")} />
          </Field>
          <Field label="실제 작업 시작">
            <Input type="time" {...form.bind("start")} />
          </Field>
          <Field label="실제 작업 종료">
            <Input type="time" {...form.bind("end")} />
          </Field>
          <Field label="작업 진행률 (%)">
            <Input type="number" min={0} max={100} {...form.bind("progress")} />
          </Field>
          <Field label="사용 장비·공구">
            <Input placeholder="실제 사용 장비·공구" {...form.bind("equipment")} />
          </Field>
        </FormGrid>
        <Field label="실제 작업내용 및 완료 실적" required>
          <Textarea rows={4} required placeholder="당일 실제 수행한 작업, 완료 구간, 작업량 등을 기록" {...form.bind("actual")} />
        </Field>

        <Panel inset title="작업 현장사진" className="mt-1 mb-4">
          <Muted className="mb-3">
            작업 전·작업 중·작업 후 사진을 각각 1장씩 첨부할 수 있습니다. 사진은 자동으로 축소·압축되어 저장됩니다.
          </Muted>
          <FormGrid cols={3}>
            {PHOTO_STAGES.map(([stage, label]) => (
              <PhotoInput
                key={stage}
                label={`${label} 사진`}
                value={form.draft.photos[stage]}
                onChange={(v) => set("photos", { ...form.draft.photos, [stage]: v })}
              />
            ))}
          </FormGrid>
          <Muted>
            권장: 현장 사진 원본은 별도 보관하고, 프로그램에는 기록 확인용으로 첨부해 주세요. 사진은 각 20MB 이하 파일을
            권장합니다.
          </Muted>
        </Panel>

        <Field label="작업 지연·변경·특이사항">
          <Textarea rows={2} placeholder="계획 대비 변경사항, 자재 지연, 타 공종 간섭 등" {...form.bind("issues")} />
        </Field>
        <Field label="안전조치·점검 및 현장 정리 내용">
          <Textarea placeholder="작업 전 안전회의, 보호구, 작업구역 통제, 점검 결과, 정리정돈 등" {...form.bind("safety")} />
        </Field>
        <FormGrid>
          <Field label="사고·아차사고 발생 여부">
            <Select options={[...WORKDIARY_INCIDENTS]} {...form.bind("incident")} />
          </Field>
          <Field label="확인자">
            <Input placeholder="현장소장·공사담당자 등" {...form.bind("confirmedBy")} />
          </Field>
        </FormGrid>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="primary">
            {mode === "edit" ? "수정 내용 저장" : mode === "copy" ? "새로 저장" : "작업일보 저장"}
          </Button>
          <Button onClick={cancel}>입력 취소</Button>
          <Checkbox
            className="ml-1"
            label="저장 후 내용 유지 (연속 입력)"
            checked={keep}
            onChange={(e) => setKeep(e.target.checked)}
          />
        </div>
      </form>
    </Panel>
  );
}
