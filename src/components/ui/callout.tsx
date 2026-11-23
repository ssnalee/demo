import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

const tones = {
  danger: { box: "border-[#fecdca] bg-[#fef3f2]", tile: "bg-[#fee4e2] text-danger", title: "text-[#b42318]", body: "text-[#d92d20]" },
  warning: { box: "border-[#fedf89] bg-[#fffaeb]", tile: "bg-[#fef0c7] text-[#dc6803]", title: "text-[#93370d]", body: "text-[#b54708]" },
  info: { box: "border-[#bae6fd] bg-brand-soft", tile: "bg-[#e0f2fe] text-brand-strong", title: "text-[#075985]", body: "text-[#0369a1]" },
} as const;

/** 색이 있는 안내 배너 (아이콘 + 제목 + 내용 + 오른쪽 버튼) */
export function Callout({
  tone = "info",
  icon = "alertCircle",
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof tones;
  icon?: IconName;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <div className={cn("mt-5 flex flex-wrap items-center gap-4 rounded-[18px] border px-5 py-4", t.box, className)}>
      <span className={cn("grid size-11 flex-none place-items-center rounded-[13px]", t.tile)}>
        <Icon name={icon} size={20} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn("text-[13.5px] font-bold", t.title)}>{title}</div>
        {children && <div className={cn("mt-0.5 text-[12.5px] leading-[1.6]", t.body)}>{children}</div>}
      </div>
      {action && <div className="no-print flex-none">{action}</div>}
    </div>
  );
}
