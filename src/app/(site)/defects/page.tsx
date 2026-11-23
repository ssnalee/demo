import { ClientOnly } from "@/components/layout/client-only";
import { DefectsPage } from "@/features/defects";

export const metadata = { title: "준공 후 하자보수 관리" };

export default function Page() {
  return (
    <ClientOnly>
      <DefectsPage />
    </ClientOnly>
  );
}
