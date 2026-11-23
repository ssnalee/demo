"use client";

import { NAV, isNavActive } from "@/constants/nav";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** 현재 경로가 속한 메뉴 그룹 이름 (예: "안전관리") */
function useSection() {
  const pathname = usePathname();
  return NAV.find((g) => g.items.some((i) => isNavActive(i.href, pathname)))?.label;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  const section = useSection();
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-4 pb-1">
      <div className="min-w-0">
        {section && (
          <div className="no-print mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-brand">
            <span aria-hidden className="h-[3px] w-3 rounded-full bg-brand" />
            {section}
          </div>
        )}
        <h2 className="text-[24px] leading-tight font-bold tracking-[-0.04em] text-fg sm:text-[28px]">{title}</h2>
        {description && <div className="mt-1.5 text-[13px] text-sub">{description}</div>}
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
