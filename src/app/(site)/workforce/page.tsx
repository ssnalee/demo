import { ClientOnly } from "@/components/layout/client-only";
import { WorkforcePage } from "@/features/workforce";

export const metadata = { title: "근로자·일일 출역 관리" };

export default function Page() {
  return (
    <ClientOnly>
      <WorkforcePage />
    </ClientOnly>
  );
}
