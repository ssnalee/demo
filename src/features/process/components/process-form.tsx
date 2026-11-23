"use client";

import { Badge, Button, Field, FormGrid, Input, Label, ListManagerModal, Panel, Select, Textarea, toast } from "@/components/ui";
import { PCT_OPTIONS } from "@/constants/options";
import { today } from "@/lib/date";
import { saveProcess } from "@/server/actions/processes";
import { saveCompanyList, useCompanyList, useGroupedMasters, type OptionGroup } from "@/lib/storage/masters";
import { useDraft } from "@/lib/use-draft";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { processStats, processTitle, sortByStart, statusTone } from "../lib";
import { reloadProcesses, useProcesses } from "../store";
import { PROCESS_STAGES, type Process } from "../types";

const empty = (): Process => ({
  id: "",
  title: "",
  stage: "",
  trade: "",
  floor: "",
  company: "",
  start: today(),
  end: "",
  progress: 0,
  predecessorId: null,
  predecessorTrade: null,
  after: "",
  note: "",
  updatedAt: "",
});

/** 공정 등록·수정 양식 (별도 화면). initial이 있으면 수정, 저장·취소 후 공정표 목록으로 */
export function ProcessForm({ initial }: { initial?: Process }) {
  const router = useRouter();
  const { items = [], siteId } = useProcesses();
  const [busy, setBusy] = useState(false);
  const { floors, trades, floorGroups, tradeGroups } = useGroupedMasters();
  const makeInitial = useCallback(() => (initial ? { ...empty(), ...initial } : empty()), [initial]);
  const form = useDraft(makeInitial);
  const { draft } = form;

  const floor = draft.floor || floors[0] || "";
  const trade = draft.trade || trades[0] || "";
  const title = processTitle({ floor, trade, stage: draft.stage });
  const others = sortByStart(items.filter((x) => String(x.id) !== String(draft.id)));
  // 선행 공정: 왼쪽 "등록된 공정" / 공종 분류 → 오른쪽 "○○ 완료 후"
  const afterGroups: OptionGroup[] = [
    ...(others.length ? [{ label: "등록된 공정", options: others.map((x) => `${x.title} 완료 후`) }] : []),
    ...tradeGroups.map((g) => ({ label: g.label, options: g.options.map((t) => `${t} 완료 후`) })),
  ];
  // 목록에 없는 기존 값(예: 이름이 바뀐 공정)도 보이게
  if (draft.after && !afterGroups.some((g) => g.options.includes(draft.after)))
    afterGroups.unshift({ label: "기존 값", options: [draft.after] });

  // 담당 업체: 업체 목록에서 하나 선택. 목록은 "업체 추가" 팝업에서 추가·삭제
  const companies = useCompanyList();
  const [companyOpen, setCompanyOpen] = useState(false);
  const companyOptions = draft.company && !companies.includes(draft.company) ? [draft.company, ...companies] : companies;

  const backToList = () => router.push("/process");

  /** 선행 공정 문구("○○ 완료 후") → 등록된 공정 id 또는 공종 이름 */
  const resolveAfter = (after: string): { predecessorId: string | null; predecessorTrade: string | null } => {
    if (!after) return { predecessorId: null, predecessorTrade: null };
    // 이름이 바뀌지 않은 기존 선행 값은 저장된 id·공종 그대로
    if (initial && after === initial.after)
      return { predecessorId: initial.predecessorId, predecessorTrade: initial.predecessorTrade };
    const proc = others.find((x) => `${x.title} 완료 후` === after);
    if (proc) return { predecessorId: proc.id, predecessorTrade: null };
    return { predecessorId: null, predecessorTrade: after.replace(/ 완료 후$/, "") };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.end < draft.start) return toast("종료일은 시작일보다 빠를 수 없습니다.", "danger");
    setBusy(true);
    const r = await saveProcess(siteId, {
      id: draft.id || undefined,
      trade,
      floor,
      stage: draft.stage,
      company: draft.company,
      start: draft.start,
      end: draft.end,
      progress: Number(draft.progress) || 0,
      ...resolveAfter(draft.after),
      note: draft.note,
    });
    setBusy(false);
    if (!r.ok) return toast(r.error, "danger");
    await reloadProcesses(siteId);
    toast(r.updated ? "공정을 수정했습니다." : "공정을 등록했습니다.");
    backToList();
  };

  const preview = processStats({ start: draft.start, end: draft.end || draft.start, progress: draft.progress });

  return (
    <form onSubmit={submit} className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* 왼쪽: 입력 (묶음별) */}
      <Panel className="mt-0">
        <FormSection title="공정 정보" first>
          <FormGrid>
            <Field label="공종" required>
              <Select groups={tradeGroups} {...form.bind("trade")} value={trade} />
            </Field>
            <Field label="층·구역" required>
              <Select groups={floorGroups} {...form.bind("floor")} value={floor} />
            </Field>
            <Field label="작업 단계">
              <Select placeholder="선택 안 함" options={[...PROCESS_STAGES]} {...form.bind("stage")} />
            </Field>
            {/* 라벨 줄 오른쪽에 "업체 추가" 버튼이 있어 Field(label) 대신 div */}
            <div className="mb-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label>담당 업체</Label>
                <button
                  type="button"
                  onClick={() => setCompanyOpen(true)}
                  className="cursor-pointer text-[12.5px] font-semibold text-brand-strong"
                >
                  + 업체 추가
                </button>
              </div>
              <Select
                aria-label="담당 업체"
                placeholder="선택 안 함"
                options={companyOptions}
                {...form.bind("company")}
              />
            </div>
          </FormGrid>
        </FormSection>
        <FormSection title="일정·진행">
          <FormGrid>
            <Field label="시작일" required>
              <Input type="date" required {...form.bind("start")} />
            </Field>
            <Field label="종료일" required>
              <Input type="date" required {...form.bind("end")} />
            </Field>
            <Field label="진행률">
              <Select
                options={PCT_OPTIONS.map((p) => ({ value: String(p), label: `${p}%` }))}
                value={String(draft.progress ?? 0)}
                onChange={(e) => form.set("progress", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="선행 공정">
              <Select placeholder="없음" groups={afterGroups} {...form.bind("after")} />
            </Field>
          </FormGrid>
        </FormSection>
        <FormSection title="메모">
          <Textarea rows={3} placeholder="필요할 때만 적으세요" {...form.bind("note")} />
        </FormSection>
      </Panel>

      {/* 오른쪽: 요약 + 저장 (데스크톱에서는 스크롤을 따라옴) */}
      <Panel className="mt-0 lg:sticky lg:top-20">
        <div className="text-[12px] font-semibold text-sub">공정명 (자동 작성)</div>
        <div className="mt-1 text-[17px] leading-snug font-bold tracking-[-0.03em] break-keep">{title || "-"}</div>
        <dl className="mt-4 space-y-2.5 border-t border-line-2 pt-4 text-[13px]">
          <SummaryRow label="기간">
            {draft.end ? `${draft.start} ~ ${draft.end} · ${preview.dur}일` : "종료일을 입력하세요"}
          </SummaryRow>
          <SummaryRow label="담당 업체">{draft.company || "-"}</SummaryRow>
          <SummaryRow label="선행 공정">{draft.after || "없음"}</SummaryRow>
          <SummaryRow label="상태">
            {draft.end ? <Badge tone={statusTone(preview.st)}>{preview.st}</Badge> : "-"}
          </SummaryRow>
        </dl>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[12px] text-sub">
            <span>진행률</span>
            <b className="text-fg">{preview.p}%</b>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-fill">
            <div className="h-full rounded-full bg-brand" style={{ width: `${preview.p}%` }} />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {busy ? "저장 중…" : "저장"}
          </Button>
          <Button onClick={backToList} className="w-full">
            취소
          </Button>
        </div>
      </Panel>
      <ListManagerModal
        open={companyOpen}
        onClose={() => setCompanyOpen(false)}
        title="업체 관리"
        description="담당 업체 선택 목록에 표시할 업체를 추가하거나 삭제합니다."
        items={companies}
        placeholder="업체명 입력 후 Enter"
        emptyText="등록된 업체가 없습니다."
        onSave={(list) => {
          saveCompanyList(list);
          toast("업체 목록을 저장했습니다.");
        }}
      />
    </form>
  );
}

/** 입력 묶음 제목 + 구분선 */
function FormSection({ title, first, children }: { title: string; first?: boolean; children: React.ReactNode }) {
  return (
    <section className={first ? "" : "mt-2 border-t border-line-2 pt-6"}>
      <h3 className="mb-4 text-[14px] font-bold tracking-[-0.02em]">{title}</h3>
      {children}
    </section>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex-none text-sub">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-keep text-fg">{children}</dd>
    </div>
  );
}
