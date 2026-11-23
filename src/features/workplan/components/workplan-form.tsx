"use client";

import { Button, Checkbox, Field, FormGrid, Input, Panel, Select, Textarea, toast } from "@/components/ui";
import { today } from "@/lib/date";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useDraft } from "@/lib/use-draft";
import { saveWorkplan } from "@/server/actions/workplans";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { reloadWorkplans, useWorkplans } from "../store";
import { WORKPLAN_STATUSES, WORKPLAN_TYPES, type Workplan } from "../types";

const empty = (): Workplan => ({
  id: "",
  date: today(),
  type: WORKPLAN_TYPES[0],
  floor: "",
  trade: "",
  title: "",
  location: "",
  leader: "",
  workers: 0,
  start: "",
  end: "",
  equipment: "",
  materials: "",
  scope: "",
  sequence: "",
  hazards: "",
  safety: "",
  emergency: "",
  status: WORKPLAN_STATUSES[0],
  reviewer: "",
  updatedAt: "",
});

/**
 * 작업계획서 한 건 등록·수정 (페이지).
 * initial 이 있으면 수정, copyFrom 이 있으면 그 내용으로 새로 등록 (날짜는 오늘, 상태는 작성중).
 * 저장하면 목록으로 이동 (등록 + "저장 후 계속 입력"이면 이 화면에 남음).
 */
export function WorkplanForm({ initial, copyFrom }: { initial?: Workplan; copyFrom?: Workplan }) {
  const router = useRouter();
  const { siteId } = useWorkplans();
  const { floors, trades, floorGroups, tradeGroups } = useGroupedMasters();
  const isEdit = !!initial;
  const makeInitial = useCallback(
    () =>
      initial
        ? { ...empty(), ...initial }
        : copyFrom
          ? { ...empty(), ...copyFrom, id: "", date: today(), status: WORKPLAN_STATUSES[0] }
          : empty(),
    [initial, copyFrom],
  );
  const form = useDraft(makeInitial);
  const [keep, setKeep] = useState(false);
  const [busy, setBusy] = useState(false);

  const backToList = () => router.push("/workplan");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = form.draft;
    if (d.start && d.end && d.end <= d.start) return toast("작업 종료 예정시간은 시작 예정시간 이후여야 합니다.", "danger");
    setBusy(true);
    const r = await saveWorkplan(siteId, {
      ...d,
      id: d.id || undefined,
      floor: d.floor || floors[0] || "",
      trade: d.trade || trades[0] || "",
      workers: Number(d.workers || 0),
    });
    setBusy(false);
    if (!r.ok) return toast(r.error, "danger");
    await reloadWorkplans(siteId);
    toast(r.updated ? "작업계획서를 수정했습니다." : "작업계획서를 저장했습니다.");
    // 연속 입력: 내용은 두고 새 건으로
    if (!isEdit && keep) return form.set("id", "");
    backToList();
  };

  return (
    <Panel>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="작업일자" required>
            <Input type="date" required {...form.bind("date")} />
          </Field>
          <Field label="작업 구분">
            <Select options={[...WORKPLAN_TYPES]} {...form.bind("type")} />
          </Field>
          <Field label="작업 층·구역" required>
            <Select groups={floorGroups} {...form.bind("floor")} value={form.draft.floor || floors[0] || ""} />
          </Field>
          <Field label="공종" required>
            <Select groups={tradeGroups} {...form.bind("trade")} value={form.draft.trade || trades[0] || ""} />
          </Field>
          <Field label="작업명" required>
            <Input required placeholder="예: 3층 천장 텍스 철거" {...form.bind("title")} />
          </Field>
          <Field label="세부 작업 위치">
            <Input placeholder="예: 동측 복도, 301호 등" {...form.bind("location")} />
          </Field>
          <Field label="작업책임자">
            <Input placeholder="성명 또는 직책" {...form.bind("leader")} />
          </Field>
          <Field label="예정 작업인원">
            <Input type="number" min={0} max={999} {...form.bind("workers")} />
          </Field>
          <Field label="작업 시작 예정">
            <Input type="time" {...form.bind("start")} />
          </Field>
          <Field label="작업 종료 예정">
            <Input type="time" {...form.bind("end")} />
          </Field>
          <Field label="사용 장비·공구">
            <Input placeholder="예: 이동식비계, 전동공구" {...form.bind("equipment")} />
          </Field>
          <Field label="자재·반입사항">
            <Input placeholder="예: 석고보드, 폐기물 반출" {...form.bind("materials")} />
          </Field>
        </FormGrid>
        <Field label="작업 목적 및 작업 범위" required>
          <Textarea rows={2} required placeholder="작업 구간, 범위, 선행·후속 공정 및 작업 간섭사항" {...form.bind("scope")} />
        </Field>
        <Field label="작업 순서 및 방법" required>
          <Textarea
            rows={4}
            required
            placeholder={"1. 작업구역 통제 및 표지 설치\n2. 설비·전기 등 사전 확인\n3. 작업 실시 및 중간 점검\n4. 정리정돈 및 완료 확인"}
            {...form.bind("sequence")}
          />
        </Field>
        <Field label="주요 위험요인 및 예상 재해">
          <Textarea placeholder="예: 개구부 추락, 상부 자재 낙하, 분진 흡입, 임시전기 감전" {...form.bind("hazards")} />
        </Field>
        <Field label="작업 전·중 안전조치 및 보호구">
          <Textarea
            placeholder="예: 작업구역 출입통제, 안전난간 확인, 분진 집진, 절연상태 점검, 안전모·안전화·보안경 착용"
            {...form.bind("safety")}
          />
        </Field>
        <Field label="비상상황 및 연락·대응 방법">
          <Textarea rows={2} placeholder="비상정지, 대피경로, 응급조치 및 현장 보고체계" {...form.bind("emergency")} />
        </Field>
        <FormGrid>
          <Field label="계획 상태">
            <Select options={[...WORKPLAN_STATUSES]} {...form.bind("status")} />
          </Field>
          <Field label="검토·승인자">
            <Input placeholder="검토자 또는 승인자" {...form.bind("reviewer")} />
          </Field>
        </FormGrid>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "저장 중…" : "저장"}
          </Button>
          <Button onClick={backToList}>취소</Button>
          {!isEdit && (
            <Checkbox className="ml-1" label="저장 후 계속 입력" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
          )}
        </div>
      </form>
    </Panel>
  );
}
