import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/** 조용한 회색 안내문 */
export function Notice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "relative mt-4 mb-1 rounded-xl border border-line-2 bg-white/60 py-3 pr-4 pl-10 text-[12.5px] leading-[1.7] text-sub before:absolute before:top-[13px] before:left-4 before:grid before:size-[16px] before:place-items-center before:rounded-full before:bg-fill-hover before:text-[10.5px] before:font-bold before:text-fg-2 before:content-['i']",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function EmptyState({ children = "등록된 자료가 없습니다." }: { children?: ReactNode }) {
  return <div className="flex flex-col items-center gap-2.5 px-6 py-10 text-center text-[13px] text-sub">
      <span className="grid size-10 place-items-center rounded-xl border border-line bg-fill text-[#98a2b3]" aria-hidden>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7l2-3h12l2 3M4 7v12a1 1 0 001 1h14a1 1 0 001-1V7M4 7h16M9 11h6" />
        </svg>
      </span>
      {children}
    </div>;
}

export function Muted({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-[13px] text-sub", className)}>{children}</div>;
}
