import { ClientOnly } from "@/components/layout/client-only";
import { RiskPage } from "@/features/risk";

export const metadata = { title: "위험성평가 등록" };

export default function Page() {
  return (
    <ClientOnly>
      <RiskPage />
    </ClientOnly>
  );
}
