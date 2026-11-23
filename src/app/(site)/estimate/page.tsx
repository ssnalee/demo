import { ClientOnly } from "@/components/layout/client-only";
import { EstimatePage } from "@/features/estimate";

export const metadata = { title: "견적·실행 관리" };

export default function Page() {
  return (
    <ClientOnly>
      <EstimatePage />
    </ClientOnly>
  );
}
