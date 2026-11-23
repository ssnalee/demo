import { ClientOnly } from "@/components/layout/client-only";
import { UsersPage } from "@/features/users/users-page";

export const metadata = { title: "계정 관리" };

export default function Page() {
  return (
    <ClientOnly requireSite={false}>
      <UsersPage />
    </ClientOnly>
  );
}
