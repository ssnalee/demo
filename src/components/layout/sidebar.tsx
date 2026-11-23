"use client";

import { NAV, isNavActive } from "@/constants/nav";
import { useMe } from "@/features/auth/use-me";
import { cn } from "@/lib/cn";
import { useUiPref } from "@/lib/storage/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronIcon, NavIcon } from "./icons";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useUiPref<Record<string, boolean>>("navCollapsed", {});
  const me = useMe();
  const groups = NAV.filter((g) => !g.adminOnly || me?.isAdmin);

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-8" aria-label="주 메뉴">
      {groups.map((g, gi) => {
        const isCollapsed = !!collapsed?.[g.id];
        return (
          <div key={g.id} className={cn(gi > 0 && "mt-4")}>
            <button
              type="button"
              aria-expanded={!isCollapsed}
              onClick={() => setCollapsed({ ...collapsed, [g.id]: !isCollapsed })}
              className="group/g flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13.5px] font-bold tracking-[-0.02em] text-fg transition-colors hover:bg-fill"
            >
              <span>{g.label}</span>
              <ChevronIcon className={cn("ml-auto text-[#98a2b3] transition-transform group-hover/g:text-fg", isCollapsed && "-rotate-90")} />
            </button>
            <div className="mt-1 ml-[18px] border-l border-line pl-2.5">
              {g.items.map((item) => {
                const active = isNavActive(item.href, pathname);
                if (isCollapsed && !active) return null;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group/i my-0.5 flex items-center gap-2.5 rounded-[11px] px-3 py-2 text-[13.5px] text-fg-2 transition-all hover:bg-brand-soft hover:text-brand-strong",
                      active &&
                        "bg-brand font-semibold text-white shadow-xs hover:bg-brand hover:text-white",
                    )}
                  >
                    <NavIcon
                      href={item.href}
                      className={cn(
                        "flex-none transition-colors",
                        active ? "text-white" : "text-[#98a2b3] group-hover/i:text-brand",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
