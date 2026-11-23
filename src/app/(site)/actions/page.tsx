import { ClientOnly } from "@/components/layout/client-only";
import { ActionsPage } from "@/features/actions";

export const metadata = { title: "개선조치 관리" };

export default function Page() {
  return (
    <ClientOnly>
      <ActionsPage />
    </ClientOnly>
  );
}
