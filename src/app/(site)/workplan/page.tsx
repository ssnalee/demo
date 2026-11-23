import { ClientOnly } from "@/components/layout/client-only";
import { WorkplanPage } from "@/features/workplan";

export const metadata = { title: "작업계획서 관리" };

export default function Page() {
  return (
    <ClientOnly>
      <WorkplanPage />
    </ClientOnly>
  );
}
