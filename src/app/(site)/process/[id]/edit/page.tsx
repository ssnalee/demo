import { ClientOnly } from "@/components/layout/client-only";
import { ProcessEditPage } from "@/features/process";

export const metadata = { title: "공정 수정" };

/** 공정 id는 브라우저 저장소에만 있으므로 화면 안에서 useParams로 읽음 */
export default function Page() {
  return (
    <ClientOnly>
      <ProcessEditPage />
    </ClientOnly>
  );
}
