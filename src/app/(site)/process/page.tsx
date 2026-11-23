import { ClientOnly } from "@/components/layout/client-only";
import { ProcessPage } from "@/features/process";

export const metadata = { title: "공정표" };

export default function Page() {
  return (
    <ClientOnly>
      <ProcessPage />
    </ClientOnly>
  );
}
