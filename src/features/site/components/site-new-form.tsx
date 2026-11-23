"use client";

import { Button, Checkbox, Modal, Muted, toast } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSite } from "../lib/sites";
import { EMPTY_SITE_INFO, SiteInfoFields, cleanSiteInfo, type SiteInfoValues } from "./site-info-modal";

/** 새 현장 입력 양식 본문: 현장 정보 전체 + 기존 현장에서 가져오기 */
function SiteNewFields({ onCreated, autoFocus }: { onCreated: () => void; autoFocus?: boolean }) {
  const router = useRouter();
  const [f, setF] = useState<SiteInfoValues>(EMPTY_SITE_INFO);
  const [copyMasters, setCopyMasters] = useState(true);
  const [copyWorkers, setCopyWorkers] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = cleanSiteInfo(f);
    if ("error" in r) return toast(r.error, "danger");
    const id = await createSite({ info: r.value, copyMasters, copyWorkers });
    if (!id) return;
    toast(`"${r.value.name}" 현장을 만들었습니다. 이 현장으로 바꿉니다.`);
    onCreated();
    router.push("/dashboard");
  };

  return (
    <form onSubmit={submit}>
      <SiteInfoFields f={f} setF={setF} autoFocus={autoFocus} />
      <div className="mb-3 flex flex-col gap-2 rounded-xl bg-[#f8f9fc] px-4 py-3">
        <Checkbox
          label="지금 현장의 층·공종 설정 가져오기"
          checked={copyMasters}
          onChange={(e) => setCopyMasters(e.target.checked)}
        />
        <Checkbox
          label="지금 현장의 근로자 명단 가져오기 (재직 중인 사람만)"
          checked={copyWorkers}
          onChange={(e) => setCopyWorkers(e.target.checked)}
        />
      </div>
      <Muted className="mb-3 text-xs">
        새 현장에는 작업일보·공정표·견적·하자 같은 자료가 비어 있는 상태로 시작합니다. 지금 현장 자료는 그대로 남습니다.
      </Muted>
      <Button type="submit" variant="primary" className="w-full">
        저장
      </Button>
    </form>
  );
}

/** "새 현장 만들기" 팝업 (사이드바 현장 선택 · 현장 관리 창 공용) */
export function SiteNewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="새 현장 만들기" description="현장을 만들면 바로 그 현장으로 바뀝니다." size="md">
      {open && <SiteNewFields onCreated={onClose} autoFocus />}
    </Modal>
  );
}
