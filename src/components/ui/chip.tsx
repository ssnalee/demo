import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

/** 켜고 끄는 알약 버튼 (층·공종 선택 등) */
export function Chip({ on, className, ...props }: ComponentProps<"button"> & { on?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={cn(
        "cursor-pointer rounded-full border px-[13px] py-1.5 text-[13px] leading-tight transition-colors",
        on
          ? "border-brand bg-brand font-semibold text-white shadow-xs"
          : "border-line bg-white text-fg-2 hover:border-[#d0d5dd] hover:bg-fill",
        className,
      )}
      {...props}
    />
  );
}
