"use client";

import { useMe } from "@/features/auth/use-me";
import { signOut } from "@/server/actions/auth";
import { LogoMark, MenuIcon } from "./icons";

export function Topbar({ onToggleNav }: { onToggleNav: () => void }) {
  const me = useMe();

  return (
    <header className="no-print sticky top-0 z-20 flex h-14 items-center justify-between gap-2.5 border-b border-line/80 bg-white/80 px-4 backdrop-blur-md backdrop-saturate-[180%] sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleNav}
          aria-label="메뉴 숨기기/보이기"
          className="mr-0.5 grid size-[34px] flex-none cursor-pointer place-items-center rounded-[10px] text-fg-2 transition-colors hover:bg-fill hover:text-fg"
        >
          <MenuIcon />
        </button>
        <LogoMark aria-hidden className="flex-none" />
        <strong className="ml-0.5 text-[15px] font-bold tracking-[-0.03em] text-fg">현장 안전관리</strong>
      </div>
      {/* 로그인 사용자 + 로그아웃 */}
      {me && (
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-[13px] font-bold text-brand-strong" aria-hidden>
            {me.name.slice(0, 1)}
          </span>
          <span className="hidden text-[13px] leading-tight sm:block">
            <b className="font-semibold text-fg">{me.name}</b>
            <span className="block text-[11.5px] text-sub">{me.isAdmin ? "관리자" : me.username}</span>
          </span>
          <form action={signOut}>
            <button type="submit" className="ml-1 cursor-pointer rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-fg-2">
              로그아웃
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
