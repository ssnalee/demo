"use client";

import {
  Button,
  Field,
  FormGrid,
  Input,
  Notice,
  Panel,
  PhotoInput,
  Select,
  Textarea,
  toast,
} from "@/components/ui";
import type { Action } from "@/features/actions/types";
import { today } from "@/lib/date";
import { newId } from "@/lib/id";
import { read, write } from "@/lib/storage/store";
import { useGroupedMasters } from "@/lib/storage/masters";
import { useDraft } from "@/lib/use-draft";
import { useEffect } from "react";
import { actionPriority, riskLevel } from "../lib";
import {
  LIKELIHOOD_OPTIONS,
  RISK_CATEGORIES,
  RISK_STATUSES,
  RISK_TYPES,
  SEVERITY_OPTIONS,
  type Risk,
} from "../types";

const empty = (): Risk => ({
  id: "",
  date: today(),
  type: RISK_TYPES[0],
  floor: "",
  trade: "",
  category: RISK_CATEGORIES[0],
  owner: "",
  hazard: "",
  existing: "",
  likelihood: 3,
  severity: 3,
  score: 9,
  control: "",
  due: "",
  status: RISK_STATUSES[0],
  beforePhoto: "",
  afterPhoto: "",
});

export const RISK_FORM_ID = "risk-form";

/** 위험성평가 저장 + 연결된 개선조치 생성/동기화 */
function saveRisk(input: Risk): boolean {
  const risks = read<Risk>("risks").slice();
  const old = risks.find((x) => String(x.id) === String(input.id));
  const id = input.id || newId();
  const l = Number(input.likelihood) || 1;
  const s = Number(input.severity) || 1;
  const item: Risk = { ...(old ?? {}), ...input, id, likelihood: l, severity: s, score: l * s };
  const idx = risks.findIndex((x) => String(x.id) === String(id));
  if (idx >= 0) risks[idx] = item;
  else risks.unshift(item);
  write("risks", risks);

  const acts = read<Action>("actions").slice();
  const ai = acts.findIndex((x) => String(x.riskId) === String(id));
  const linked = {
    title: item.hazard,
    floor: item.floor,
    owner: item.owner,
    due: item.due,
    priority: actionPriority(item.score),
    control: item.control,
  };
  if (ai >= 0) {
    acts[ai] = { ...acts[ai], ...linked };
    write("actions", acts);
  } else if (idx < 0) {
    acts.unshift({ id: newId(), riskId: id, ...linked, status: item.status === "조치중" ? "조치중" : "조치대기" });
    write("actions", acts);
  }
  return !!old;
}

export function RiskForm({ editing, onDone }: { editing: Risk | null; onDone: () => void }) {
  const { floors, trades, floorGroups, tradeGroups } = useGroupedMasters();
  const form = useDraft(empty);
  const { load, reset, set, draft } = form;

  useEffect(() => {
    if (editing) load(editing);
  }, [editing, load]);

  const score = (Number(draft.likelihood) || 0) * (Number(draft.severity) || 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.hazard.trim() || !draft.control.trim()) return toast("위험요인과 개선대책을 입력해 주세요.", "danger");
    const updated = saveRisk({
      ...draft,
      floor: draft.floor || floors[0] || "",
      trade: draft.trade || trades[0] || "",
    });
    reset();
    onDone();
    toast(updated ? "위험성평가를 수정했습니다." : "위험성평가와 개선조치를 저장했습니다.");
  };

  return (
    <Panel id={RISK_FORM_ID}>
      <form onSubmit={submit}>
        <FormGrid>
          <Field label="평가일자" required>
            <Input type="date" required {...form.bind("date")} />
          </Field>
          <Field label="평가 유형">
            <Select options={[...RISK_TYPES]} {...form.bind("type")} />
          </Field>
          <Field label="작업 층·구역">
            <Select groups={floorGroups} {...form.bind("floor")} />
          </Field>
          <Field label="공종">
            <Select groups={tradeGroups} {...form.bind("trade")} />
          </Field>
          <Field label="위험분야">
            <Select options={[...RISK_CATEGORIES]} {...form.bind("category")} />
          </Field>
          <Field label="담당자">
            <Input placeholder="조치 담당자" {...form.bind("owner")} />
          </Field>
        </FormGrid>
        <Field label="작업 단계 및 위험요인" required>
          <Textarea rows={2} required placeholder="예: 천장 철거 중 상부 자재 낙하 위험" {...form.bind("hazard")} />
        </Field>
        <Field label="예상 재해 및 기존 안전조치">
          <Textarea rows={2} placeholder="예상 재해와 현재 설치된 안전조치" {...form.bind("existing")} />
        </Field>
        <FormGrid>
          <Field label="발생 가능성 (1~5)">
            <Select
              options={LIKELIHOOD_OPTIONS}
              value={String(draft.likelihood)}
              onChange={(e) => set("likelihood", Number(e.target.value))}
            />
          </Field>
          <Field label="중대성 (1~5)">
            <Select
              options={SEVERITY_OPTIONS}
              value={String(draft.severity)}
              onChange={(e) => set("severity", Number(e.target.value))}
            />
          </Field>
        </FormGrid>
        <Notice className="mt-0 mb-4">
          초기 위험도: <b className="text-fg">{score}점</b> · {riskLevel(score)} (시제품 예시 기준; 현장 승인 평가기준으로 조정 필요)
        </Notice>
        <Field label="추가 개선대책" required>
          <Textarea required placeholder="제거·대체·공학적 대책·관리적 대책·보호구 순으로 검토" {...form.bind("control")} />
        </Field>
        <FormGrid>
          <Field label="개선조치 기한">
            <Input type="date" {...form.bind("due")} />
          </Field>
          <Field label="초기 상태">
            <Select options={[...RISK_STATUSES]} {...form.bind("status")}>
              {draft.status && !(RISK_STATUSES as readonly string[]).includes(draft.status) && (
                <option value={draft.status}>{draft.status}</option>
              )}
            </Select>
          </Field>
        </FormGrid>
        <FormGrid>
          <PhotoInput label="위험 현장 사진" value={draft.beforePhoto} onChange={(v) => set("beforePhoto", v)} />
          <PhotoInput label="개선 완료 사진" value={draft.afterPhoto} onChange={(v) => set("afterPhoto", v)} />
        </FormGrid>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary">
            {draft.id ? "위험성평가 수정 저장" : "위험요인 저장 및 개선조치 생성"}
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
