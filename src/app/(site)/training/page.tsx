import { ClientOnly } from "@/components/layout/client-only";
import { TrainingPage } from "@/features/training";

export const metadata = { title: "안전교육 기록" };

export default function Page() {
  return (
    <ClientOnly>
      <TrainingPage />
    </ClientOnly>
  );
}
