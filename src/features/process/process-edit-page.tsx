"use client";

import { Button, EmptyState, PageHeader, Panel } from "@/components/ui";
import { useParams, useRouter } from "next/navigation";
import { ProcessForm } from "./components/process-form";
import { useProcesses } from "./store";

function BackButton() {
  const router = useRouter();
  return <Button onClick={() => router.push("/process")}>목록으로</Button>;
}

/** /process/new */
export function ProcessNewPage() {
  return (
    <>
      <PageHeader title="공정 등록" actions={<BackButton />} />
      <ProcessForm />
    </>
  );
}

/** /process/[id]/edit */
export function ProcessEditPage() {
  const { id } = useParams<{ id: string }>();
  const { items } = useProcesses();
  const item = items?.find((x) => String(x.id) === String(id));
  return (
    <>
      <PageHeader title="공정 수정" actions={<BackButton />} />
      {items === undefined ? (
        <p className="py-16 text-center text-[13px] text-sub">불러오는 중…</p>
      ) : item ? (
        <ProcessForm key={item.id} initial={item} />
      ) : (
        <Panel>
          <EmptyState>해당 공정을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.</EmptyState>
        </Panel>
      )}
    </>
  );
}
