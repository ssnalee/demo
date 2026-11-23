"use client";

import { Button, Field, FormGrid, Input, Modal, Select, toast } from "@/components/ui";
import { getCurrentSite, reloadSites } from "@/lib/site-store";
import { updateSite } from "@/server/actions/sites";
import { useState } from "react";
import { SITE_TYPES } from "../types";


/** 현장 정보 입력칸 값 (현장소장은 만든 사람 = 사용자 연결이라 입력칸 없음) */
export interface SiteInfoValues {
  name: string;
  type: string;
  basement: string;
  above: string;
  start: string;
  end: string;
  address: string;
}
type Form = SiteInfoValues;

export const EMPTY_SITE_INFO: SiteInfoValues = {
  name: "",
  type: "",
  basement: "0",
  above: "",
  start: "",
  end: "",
  address: "",
};

/** 앞뒤 공백 제거 + 날짜 검사. 문제가 있으면 안내 문구, 없으면 정리된 값 */
export function cleanSiteInfo(f: SiteInfoValues): { value: SiteInfoValues } | { error: string } {
  const v = Object.fromEntries(Object.entries(f).map(([k, x]) => [k, x.trim()])) as SiteInfoValues;
  if (!v.name) return { error: "현장명을 입력해 주세요." };
  if (v.start && v.end && v.end < v.start) return { error: "준공 예정일은 착공일보다 빠를 수 없습니다." };
  return { value: v };
}

/** 현장 정보 입력 칸 (현장 정보 수정 · 새 현장 만들기 공용) */
export function SiteInfoFields({
  f,
  setF,
  autoFocus,
}: {
  f: SiteInfoValues;
  setF: React.Dispatch<React.SetStateAction<SiteInfoValues>>;
  autoFocus?: boolean;
}) {
  const bind = (k: keyof SiteInfoValues) => ({
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((d) => ({ ...d, [k]: e.target.value })),
  });
  return (
    <>
      {/* 2열: 현장명·공사 종류 / 지하·지상 층수 / 착공·준공 예정일, 주소는 한 줄 전체 */}
      <FormGrid>
        <Field label="현장명" required>
          <Input required autoFocus={autoFocus} placeholder="예: 구리 클래식 요양원 리모델링" {...bind("name")} />
        </Field>
        <Field label="공사 종류">
          <Select placeholder="선택 안 함" options={[...SITE_TYPES]} {...bind("type")} />
        </Field>
        <Field label="지하 층수">
          <Input type="number" inputMode="numeric" min={0} max={20} step={1} placeholder="0" {...bind("basement")} />
        </Field>
        <Field label="지상 층수">
          <Input type="number" inputMode="numeric" min={1} max={200} step={1} placeholder="예: 5" {...bind("above")} />
        </Field>
        <Field label="착공일">
          <Input type="date" {...bind("start")} />
        </Field>
        <Field label="준공 예정일">
          <Input type="date" {...bind("end")} />
        </Field>
      </FormGrid>
      <Field label="현장 주소">
        <Input placeholder="선택" {...bind("address")} />
      </Field>
    </>
  );
}

/** 지금 현장의 DB 정보로 시작 */
function initialForm(): Form {
  const x = getCurrentSite();
  return {
    name: x?.name ?? "",
    type: x?.constructionType ?? "",
    basement: String(x?.basementFloors ?? 0),
    above: x?.aboveFloors ? String(x.aboveFloors) : "",
    start: x?.startDate ?? "",
    end: x?.endDate ?? "",
    address: x?.address ?? "",
  };
}

/** 현장 정보 수정 (현장명은 상단·대시보드·보고서·모든 출력물에 표시) */
export function SiteInfoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="현장 정보"
      description="현장명은 상단, 대시보드, 보고서와 모든 출력물에 표시됩니다."
    >
      {open && <SiteInfoForm onClose={onClose} />}
    </Modal>
  );
}

function SiteInfoForm({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState<Form>(initialForm);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const site = getCurrentSite();
    if (!site) return toast("현장을 먼저 선택해 주세요.", "danger");
    const r = cleanSiteInfo(f);
    if ("error" in r) return toast(r.error, "danger");
    setBusy(true);
    const res = await updateSite(site.id, r.value);
    setBusy(false);
    if (!res.ok) return toast(res.error, "danger");
    await reloadSites();
    toast("현장 정보를 저장했습니다.");
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <SiteInfoFields f={f} setF={setF} autoFocus />
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "저장 중…" : "저장"}
        </Button>
        <Button onClick={onClose}>취소</Button>
      </div>
    </form>
  );
}
