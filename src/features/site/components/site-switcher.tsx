"use client";

import { Icon, toast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useSites } from "@/lib/site-store";
import { useSiteId } from "@/lib/storage/hooks";
import { useEffect, useRef, useState } from "react";
import { switchSite } from "../lib/sites";

/** 사이드바 맨 위: 현재 현장 + 드롭다운(현장 전환 · 새 현장 · 현장 관리) */
export function SiteSwitcher({
  onManage,
  onCreate,
  onSwitched,
}: {
  onManage: () => void;
  /** "새 현장 만들기" → 새 현장 팝업 */
  onCreate: () => void;
  onSwitched?: () => void;
}) {
  const siteId = useSiteId();
  const reg = useSites().sites ?? [];
  const me = reg.find((x) => x.id === siteId);
  const done = me?.status === "done";

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 · Esc 로 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sorted = reg
    .slice()
    .sort(
      (a, b) =>
        (a.id === siteId ? -1 : b.id === siteId ? 1 : 0) || Number(a.status === "done") - Number(b.status === "done"),
    );

  const manage = () => {
    setOpen(false);
    onManage();
  };
  const create = () => {
    setOpen(false);
    onCreate();
  };

  return (
    <div ref={rootRef} className="relative px-4 pt-4">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-[14px] border border-line bg-white p-2.5 text-left shadow-xs transition-colors hover:border-[#d0d5dd]",
          open && "border-brand shadow-[0_0_0_2px_var(--color-brand-ring)] hover:border-brand",
        )}
      >
        <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-brand-soft text-brand">
          <Icon name="hardhat" size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold tracking-[-0.02em] text-fg">
            {me?.name ?? (reg.length ? "현장 선택" : "현장 없음")}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-sub">
            <span className={cn("size-1.5 rounded-full", done ? "bg-[#98a2b3]" : "bg-success")} />
            {done ? "완료 현장" : "진행 중"}
            {reg.length > 1 && <span className="text-[#98a2b3]">· 현장 {reg.length}개</span>}
          </span>
        </span>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-none text-[#98a2b3]" aria-hidden>
          <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-4 top-[calc(100%+6px)] z-30 animate-pop-in overflow-hidden rounded-[14px] border border-line bg-white shadow-pop">
          <div className="px-3 pt-2.5 pb-1 text-[11.5px] font-semibold text-sub">현장 변경</div>
          <ul role="listbox" aria-label="현장 목록" className="max-h-[280px] overflow-y-auto px-1.5 pb-1.5">
            {sorted.map((s) => {
              const current = s.id === siteId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={current}
                    onClick={async () => {
                      if (current) return setOpen(false);
                      if (await switchSite(s.id)) {
                        toast(`"${s.name}" 현장으로 바꿨습니다.`);
                        setOpen(false);
                        onSwitched?.();
                      }
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-fill",
                      current && "bg-brand-soft font-semibold text-brand-strong hover:bg-brand-soft",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                    {s.status === "done" && (
                      <span className="flex-none rounded-full bg-fill px-1.5 text-[10.5px] font-semibold text-sub">완료</span>
                    )}
                    {current && <Icon name="check" size={15} className="flex-none text-brand" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-line-2 p-1.5">
            <button
              type="button"
              onClick={create}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-fg-2 transition-colors hover:bg-fill hover:text-fg"
            >
              <span className="grid size-5 place-items-center rounded-md bg-fill text-[14px] font-bold text-sub">+</span>새 현장 만들기
            </button>
            <button
              type="button"
              onClick={manage}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-fg-2 transition-colors hover:bg-fill hover:text-fg"
            >
              <Icon name="layers" size={16} className="mx-0.5 text-sub" />
              현장 관리
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
