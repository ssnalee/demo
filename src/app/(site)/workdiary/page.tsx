import { ClientOnly } from "@/components/layout/client-only";
import { WorkdiaryPage } from "@/features/workdiary";

export const metadata = { title: "작업일보 관리" };

export default function Page() {
  return (
    <ClientOnly>
      <WorkdiaryPage />
    </ClientOnly>
  );
}
