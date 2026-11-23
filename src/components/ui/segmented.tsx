"use client";

import { cn } from "@/lib/cn";

/** 버튼 묶음 선택 (예: 일 / 주 / 월) */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("inline-flex rounded-[10px] bg-fill p-[3px]", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "cursor-pointer rounded-[8px] px-3 py-1 text-[12.5px] font-medium text-sub",
              on && "bg-white font-semibold text-fg shadow-xs",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
