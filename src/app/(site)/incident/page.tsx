import { ClientOnly } from "@/components/layout/client-only";
import { IncidentPage } from "@/features/incident";

export const metadata = { title: "사고·아차사고 등록" };

export default function Page() {
  return (
    <ClientOnly>
      <IncidentPage />
    </ClientOnly>
  );
}
