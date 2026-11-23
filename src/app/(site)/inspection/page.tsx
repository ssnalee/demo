import { ClientOnly } from "@/components/layout/client-only";
import { InspectionPage } from "@/features/inspection";

export const metadata = { title: "안전점검 등록" };

export default function Page() {
  return (
    <ClientOnly>
      <InspectionPage />
    </ClientOnly>
  );
}
