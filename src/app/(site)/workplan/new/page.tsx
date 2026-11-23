import { ClientOnly } from "@/components/layout/client-only";
import { WorkplanNewPage } from "@/features/workplan";

export const metadata = { title: "작업계획서 등록" };

export default function Page() {
  return (
    <ClientOnly>
      <WorkplanNewPage />
    </ClientOnly>
  );
}
