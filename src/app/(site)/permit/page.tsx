import { ClientOnly } from "@/components/layout/client-only";
import { PermitPage } from "@/features/permit";

export const metadata = { title: "작업허가 관리" };

export default function Page() {
  return (
    <ClientOnly>
      <PermitPage />
    </ClientOnly>
  );
}
