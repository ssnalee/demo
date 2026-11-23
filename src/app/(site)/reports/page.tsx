import { ClientOnly } from "@/components/layout/client-only";
import { ReportsPage } from "@/features/reports";

export const metadata = { title: "안전관리 보고서" };

export default function Page() {
  return (
    <ClientOnly>
      <ReportsPage />
    </ClientOnly>
  );
}
