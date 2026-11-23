import { ClientOnly } from "@/components/layout/client-only";
import { SchedulePage } from "@/features/schedule";

export const metadata = { title: "일정관리 및 중요일정" };

export default function Page() {
  return (
    <ClientOnly>
      <SchedulePage />
    </ClientOnly>
  );
}
