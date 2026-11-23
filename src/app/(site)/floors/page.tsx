import { ClientOnly } from "@/components/layout/client-only";
import { FloorsPage } from "@/features/floors";

export const metadata = { title: "층별·공종 관리" };

export default function Page() {
  return (
    <ClientOnly>
      <FloorsPage />
    </ClientOnly>
  );
}
