import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { IconTile, type IconName, type TileColor } from "./icon";

/** 흰색 카드 면. 패널 안의 패널은 inset으로 회색 면 */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  inset,
  id,
  icon,
  iconColor,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  inset?: boolean;
  id?: string;
  /** 제목 옆 그라데이션 아이콘 타일 */
  icon?: IconName;
  iconColor?: TileColor;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mt-4 rounded-[20px] border p-4 sm:p-6",
        inset ? "rounded-xl border-line-2 bg-[#f8f9fc]" : "border-line/60 bg-surface shadow-card",
        className,
      )}
    >
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {icon && <IconTile name={icon} color={iconColor} size="sm" />}
            <div className="min-w-0">
            {title && <h3 className="text-[15.5px] font-bold tracking-[-0.025em]">{title}</h3>}
            {description && <p className="mt-1 text-[13px] text-sub">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** 접었다 펼치는 패널 (여러 건 등록 등) */
export function Disclosure({
  title,
  description,
  children,
  defaultOpen,
  className,
  onToggle,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  onToggle?: (open: boolean) => void;
}) {
  return (
    <details
      open={defaultOpen}
      onToggle={(e) => onToggle?.((e.currentTarget as HTMLDetailsElement).open)}
      className={cn("group mt-4 rounded-[20px] border border-line/60 bg-surface shadow-card", className)}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-4 py-[18px] transition-colors hover:bg-[#fcfcfd] sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="grid size-7 flex-none place-items-center rounded-[9px] bg-brand-soft text-[15px] font-bold text-brand transition-all group-open:bg-brand group-open:text-white">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
        <b className="text-[15px]">{title}</b>
        {description && <span className="text-[13px] text-sub">{description}</span>}
      </summary>
      <div className="px-4 pb-5 sm:px-6">{children}</div>
    </details>
  );
}
