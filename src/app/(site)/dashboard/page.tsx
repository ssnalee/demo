import { ClientOnly } from "@/components/layout/client-only";
import { DashboardPage } from "@/features/dashboard";

export const metadata = { title: "현장 대시보드" };

export default function Page() {
  return (
    <ClientOnly>
      <DashboardPage />
    </ClientOnly>
  );
}
