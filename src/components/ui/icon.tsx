import { cn } from "@/lib/cn";
import type { SVGProps } from "react";

/** 공통 라인 아이콘 (24×24) */
const PATHS = {
  doc: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h4",
  card: "M3 6h18v12H3zM3 10h18M7 15h3",
  chart: "M4 19h16M7 16v-4M11 16V8M15 16v-6M19 16V5",
  trend: "M3 17l6-6 4 4 7-7M15 8h5v5",
  user: "M12 11a4 4 0 100-8 4 4 0 000 8zM4 21c.7-4 3.9-6.5 8-6.5s7.3 2.5 8 6.5",
  users: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.5a3.5 3.5 0 010 6.5M18.5 14.8c1.7.8 2.8 2.6 3 5.2",
  alert: "M12 4l9.5 16h-19zM12 10v4M12 17h0",
  alertCircle: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v5M12 16h0",
  shield: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4",
  check: "M12 3a9 9 0 100 18 9 9 0 000-18zM8 12l3 3 5-6",
  clock: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2",
  calendar: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18",
  percent: "M19 5L5 19M7 9a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z",
  wrench: "M14.7 6.3a4 4 0 00-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 005.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  hardhat: "M3 18h18M5 18v-3a7 7 0 0114 0v3M10 8V5h4v3",
  cloud: "M7 18a4 4 0 01-.5-8 6 6 0 0111.5 1.5A3.5 3.5 0 0117.5 18zM12 11v5M10 14l2 2 2-2",
  progress: "M4 12a8 8 0 1016 0 8 8 0 00-16 0zM12 4v8l5.5 5.5",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, ...p }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...p}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** 아이콘 타일 색상: 기본은 하늘색, 위험(danger)·완료(success)만 의미 색 */
const SKY = "bg-brand-soft text-brand ring-[#e0f2fe]";
export const TILE = {
  sky: SKY,
  success: "bg-success-soft text-success ring-[#d1fadf]",
  danger: "bg-danger-soft text-danger ring-[#fee4e2]",
} as const;

export type TileColor = keyof typeof TILE;

export function IconTile({
  name,
  color = "sky",
  size = "md",
  className,
}: {
  name: IconName;
  color?: TileColor;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid flex-none place-items-center ring-1 ring-inset",
        size === "md" ? "size-11 rounded-[13px]" : "size-9 rounded-[11px]",
        TILE[color],
        className,
      )}
    >
      <Icon name={name} size={size === "md" ? 20 : 17} strokeWidth={2} />
    </span>
  );
}
