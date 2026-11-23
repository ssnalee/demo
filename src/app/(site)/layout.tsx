import { AppShell } from "@/components/layout/app-shell";

/** 현장 화면 공통 레이아웃: 상단바 + 사이드바 + 본문 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
