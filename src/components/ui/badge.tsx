import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

const tones = {
  warning: "bg-warning-soft text-warning ring-[#fedf89]",
  success: "bg-success-soft text-success ring-[#abefc6]",
  danger: "bg-danger-soft text-danger ring-[#fecdca]",
  info: "bg-info-soft text-info ring-[#b2ddff]",
  neutral: "bg-fill text-fg-2 ring-line",
  dark: "bg-brand text-white ring-brand",
} as const;

export type BadgeTone = keyof typeof tones;

/** 점 + 텍스트 상태 표시 */
export function Badge({
  tone = "neutral",
  dot = true,
  children,
  className,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-[2px] pr-2.5 pl-2 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        !dot && "pl-2.5",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** 작은 회색 메타 태그 (층 · 공종 등) */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("rounded-md border border-line-2 bg-fill px-2 py-0.5 text-xs text-fg-2", className)}>{children}</span>;
}
