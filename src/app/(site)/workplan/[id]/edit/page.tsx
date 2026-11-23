import { ClientOnly } from "@/components/layout/client-only";
import { WorkplanEditPage } from "@/features/workplan";

export const metadata = { title: "작업계획서 수정" };

/** 작업계획서 id 는 화면 안에서 useParams 로 읽음 */
export default function Page() {
  return (
    <ClientOnly>
      <WorkplanEditPage />
    </ClientOnly>
  );
}
