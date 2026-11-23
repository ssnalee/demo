"use client";

import { Button, Modal, toast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useSites } from "@/lib/site-store";
import { useSiteId } from "@/lib/storage/hooks";
import type { SiteDTO } from "@/server/actions/sites";
import { useState } from "react";
import { siteRead } from "../lib/registry";
import { deleteSite, switchSite, toggleSiteDone } from "../lib/sites";
import { SiteInfoModal } from "./site-info-modal";
import { SiteNewModal } from "./site-new-form";

/** 현장 목록·전환·새 현장·완료 처리·삭제 */
export function SiteManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  return (
    <>
      <Modal open={open} onClose={onClose} title="현장 목록" size="md" className="max-w-[620px]">
        {open && (
          <SiteManagerBody
            onClose={onClose}
            onEditInfo={() => {
              onClose();
              setInfoOpen(true);
            }}
            onCreateNew={() => {
              onClose();
              setNewOpen(true);
            }}
          />
        )}
      </Modal>
      <SiteInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      <SiteNewModal open={newOpen} onClose={() => setNewOpen(false)} />
    </>
  );
}

function SiteManagerBody({
  onClose,
  onEditInfo,
  onCreateNew,
}: {
  onClose: () => void;
  onEditInfo: () => void;
  onCreateNew: () => void;
}) {
  const siteId = useSiteId();
  const reg = useSites().sites ?? [];
  const sorted = reg
    .slice()
    .sort(
      (a, b) =>
        (a.id === siteId ? -1 : b.id === siteId ? 1 : 0) || Number(a.status === "done") - Number(b.status === "done"),
    );

  return (
    <div>
      <p className="-mt-2 mb-3 text-xs text-sub">현장 {reg.length}개</p>
      <div className="flex flex-col gap-2">
        {sorted.map((s) => (
          <SiteRow
            key={s.id}
            site={s}
            current={s.id === siteId}
            onEditInfo={onEditInfo}
            onSwitch={async () => {
              if (await switchSite(s.id)) {
                toast(`"${s.name}" 현장으로 바꿨습니다.`);
                onClose();
              }
            }}
          />
        ))}
      </div>
      <Button variant="primary" className="mt-4 w-full" onClick={onCreateNew}>
        + 새 현장 만들기
      </Button>
    </div>
  );
}

function SiteRow({
  site,
  current,
  onSwitch,
  onEditInfo,
}: {
  site: SiteDTO;
  current: boolean;
  onSwitch: () => void;
  onEditInfo: () => void;
}) {
  const done = site.status === "done";
  const [diaries, defects, estimates] = (["workdiaries", "defects", "estimateExecutions"] as const).map(
    (k) => siteRead(site.id, k).length,
  );
  const head = [site.constructionType, site.managerName ? "소장 " + site.managerName : ""].filter(Boolean).join(" · ");

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between",
        current ? "border-[#bae6fd] bg-brand-soft/60" : "border-line bg-white",
        done && "bg-bg opacity-80",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
          <span className="break-all">{site.name}</span>
          {current && <span className="rounded-full bg-[#e0f2fe] px-2 py-px text-[11px] font-semibold text-brand-strong">지금 현장</span>}
          {done && <span className="rounded-full bg-fill px-2 py-px text-[11px] font-semibold text-fg-2">완료</span>}
        </div>
        <div className="mt-0.5 text-xs text-sub">
          {head}
          {head ? " · " : ""}작업일보 {diaries} · 하자 {defects} · 견적 {estimates}
        </div>
      </div>
      <div className="flex flex-none flex-wrap gap-1.5">
        {current ? (
          <Button size="sm" onClick={onEditInfo}>
            현장 정보 수정
          </Button>
        ) : (
          <Button size="sm" variant="primary" onClick={onSwitch}>
            이 현장 열기
          </Button>
        )}
        <Button size="sm" onClick={() => void toggleSiteDone(site)}>
          {done ? "다시 진행" : "완료로 표시"}
        </Button>
        {!current && (
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              if (await deleteSite(site.id)) toast("현장을 삭제했습니다.");
            }}
          >
            삭제
          </Button>
        )}
      </div>
    </div>
  );
}
