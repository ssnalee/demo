import { cn } from "@/lib/cn";
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { IconTile, type IconName, type TileColor } from "./icon";

const DEFAULT_ICON: IconName[] = ["chart", "check", "trend", "users", "layers", "progress"];

type StatProps = {
  label: ReactNode;
  value: ReactNode;
  tone?: "danger" | "success";
  hint?: ReactNode;
  /** 아이콘 타일 (미지정 시 묶음 안 순서대로 자동). 색은 tone을 따르고 기본은 하늘색 */
  icon?: IconName;
  color?: TileColor;
  /** StatGroup이 넣어주는 순서 */
  index?: number;
};

/** 숫자 지표 묶음: 카드 타일 그리드. 아이콘을 지정하지 않으면 순서대로 기본 아이콘을 넣어 줌 */
export function StatGroup({ children, className }: { children: ReactNode; className?: string }) {
  let i = 0;
  return (
    <div className={cn("mt-4 grid grid-cols-1 gap-3.5 min-[480px]:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]", className)}>
      {Children.map(children, (c) =>
        isValidElement(c) ? cloneElement(c as ReactElement<StatProps>, { index: i++ }) : c,
      )}
    </div>
  );
}

export function Stat({ label, value, tone, hint, icon, color, index = 0 }: StatProps) {
  const tileColor: TileColor = color ?? (tone ?? "sky");
  const tileIcon: IconName = icon ?? (tone === "danger" ? "alert" : tone === "success" ? "check" : DEFAULT_ICON[index % DEFAULT_ICON.length]);
  return (
    <div className="rounded-[18px] border border-line/60 bg-surface px-5 py-[18px] shadow-card transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(16,24,40,.18)]">
      {/* 아이콘 왼쪽(세로 가운데) + 라벨·숫자는 오른쪽 한 기준선 (아래 StatMini와 같은 구조) */}
      <div className="flex items-center gap-3">
        <IconTile name={tileIcon} color={tileColor} size="sm" className="size-8 rounded-[10px] [&_svg]:size-4" />
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-sub">{label}</div>
          <div
            className={cn(
              "mt-1 text-[28px] leading-[1.1] font-bold tracking-[-0.04em] text-fg",
              tone === "danger" && "text-danger",
              tone === "success" && "text-success",
            )}
          >
            {value}
          </div>
          {hint && <div className="mt-1.5 text-xs text-sub">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

/** 보조 지표 줄: 위 StatGroup(4칸)과 같은 격자·간격의 작은 카드 → 세로줄이 맞음 */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-4", className)}>{children}</div>;
}

export function StatMini({ label, value, icon }: { label: ReactNode; value: ReactNode; icon?: IconName }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-line/60 bg-surface px-5 py-3.5 shadow-card">
      {icon && <IconTile name={icon} size="sm" className="size-8 rounded-[10px] [&_svg]:size-4" />}
      <div className="min-w-0">
        <div className="text-[12px] text-sub">{label}</div>
        <div className="text-[17px] leading-tight font-bold tracking-[-0.03em] text-fg">{value}</div>
      </div>
    </div>
  );
}

/** 건수 알약: 0이면 회색, 1 이상이면 tone 색 */
export function CountPill({
  label,
  count,
  tone = "brand",
}: {
  label: ReactNode;
  count: number;
  tone?: "brand" | "danger";
}) {
  const on = count > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] font-medium",
        !on && "bg-fill text-sub",
        on && tone === "danger" && "bg-danger-soft text-danger",
        on && tone === "brand" && "bg-brand-soft text-brand-strong",
      )}
    >
      <b className={cn("text-[15px] font-bold tabular-nums", !on && "text-fg-2")}>{count}</b>
      {label}
    </span>
  );
}
