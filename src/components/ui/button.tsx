import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

/** 호버 효과 없음 (색·테두리 고정) */
const variants = {
  primary: "bg-brand text-white border border-brand shadow-xs",
  secondary: "bg-white text-fg border border-line shadow-xs",
  danger: "bg-white text-danger border border-line shadow-xs",
  ghost: "bg-transparent text-sub border border-transparent",
  link: "bg-transparent border-0 !p-0 text-xs font-medium text-sub underline underline-offset-[3px] decoration-[#d0d5dd]",
} as const;

const sizes = {
  md: "rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold",
  sm: "rounded-lg px-[11px] py-1.5 text-[12.5px] font-medium",
} as const;

export type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ variant = "secondary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
