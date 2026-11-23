"use client";

import { CompanyDatalist } from "@/components/data";
import { DialogHost, PhotoViewer, Toaster } from "@/components/ui";
import { SiteManagerModal, SiteNewModal, SiteSwitcher } from "@/features/site";
import { useUiPref } from "@/lib/storage/hooks";
import { cn } from "@/lib/cn";
import { Suspense, useState, useSyncExternalStore, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ScheduleStartupAlert } from "@/features/schedule";

const noop = () => () => {};
function useIsClient() {
  return useSyncExternalStore(noop, () => true, () => false);
}

export function AppShell({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  const [navHidden, setNavHidden] = useUiPref<boolean>("navHidden", false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sitesOpen, setSitesOpen] = useState(false);
  const [newSiteOpen, setNewSiteOpen] = useState(false);
  const toggleNav = () => {
    if (window.matchMedia("(max-width: 1023px)").matches) setMobileOpen((v) => !v);
    else setNavHidden(!navHidden);
  };

  return (
    <>
      <Topbar onToggleNav={toggleNav} />
      <div className={cn("grid min-h-[calc(100vh-56px)] grid-cols-1", !navHidden && "lg:grid-cols-[248px_1fr]")}>
        {/* 데스크톱 사이드바 */}
        <aside
          className={cn(
            "no-print sticky top-14 hidden h-[calc(100vh-56px)] flex-col border-r border-line/70 bg-white",
            !navHidden && "lg:flex",
          )}
        >
          {isClient && <SiteSwitcher onManage={() => setSitesOpen(true)} onCreate={() => setNewSiteOpen(true)} />}
          {/* 동적 경로(/process/[id]/edit 등)는 빌드 시 주소를 모르므로 사이드바(usePathname)를 Suspense로 감쌈 */}
          <Suspense fallback={<div className="flex-1" />}>
            <Sidebar />
          </Suspense>
        </aside>
        {/* 모바일 드로어 */}
        {mobileOpen && (
          <div className="no-print fixed inset-0 top-14 z-30 animate-fade-in lg:hidden" onClick={() => setMobileOpen(false)}>
            <div className="absolute inset-0 bg-[rgba(16,24,40,.35)] backdrop-blur-[2px]" />
            <aside className="absolute inset-y-0 left-0 flex w-[268px] flex-col bg-white shadow-pop" onClick={(e) => e.stopPropagation()}>
              <SiteSwitcher
                onManage={() => {
                  setMobileOpen(false);
                  setSitesOpen(true);
                }}
                onCreate={() => {
                  setMobileOpen(false);
                  setNewSiteOpen(true);
                }}
                onSwitched={() => setMobileOpen(false)}
              />
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}
        <main className="mx-auto w-full max-w-[1360px] min-w-0 px-4 pt-7 pb-16 sm:px-6 lg:px-12 lg:pt-10">
          {/* 본문의 브라우저 전용 렌더링은 각 page 안의 <ClientOnly>가 담당 */}
          {children}
        </main>
      </div>
      {isClient && (
        <>
          <ScheduleStartupAlert />
          <SiteManagerModal open={sitesOpen} onClose={() => setSitesOpen(false)} />
          <SiteNewModal open={newSiteOpen} onClose={() => setNewSiteOpen(false)} />
          <CompanyDatalist />
          <PhotoViewer />
          <Toaster />
          <DialogHost />
        </>
      )}
    </>
  );
}
