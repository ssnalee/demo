import { ClientOnly } from "@/components/layout/client-only";
import { ProcessNewPage } from "@/features/process";

export const metadata = { title: "공정 등록" };

export default function Page() {
  return (
    <ClientOnly>
      <ProcessNewPage />
    </ClientOnly>
  );
}
