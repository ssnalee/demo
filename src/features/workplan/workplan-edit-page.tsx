"use client";

import { Button, EmptyState, PageHeader, Panel, Segmented } from "@/components/ui";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { WorkplanBulk } from "./components/workplan-bulk";
import { WorkplanForm } from "./components/workplan-form";
import { useWorkplans } from "./store";

function BackButton() {
  const router = useRouter();
  return <Button onClick={() => router.push("/workplan")}>목록으로</Button>;
}

const Loading = () => <p className="py-16 text-center text-[13px] text-sub">불러오는 중…</p>;

/** /workplan/new — 한 건 등록 · 여러 건 등록 (?mode=bulk), 복사 (?copy=id) */
export function WorkplanNewPage() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode") === "bulk" ? "bulk" : "single";
  const copyId = params.get("copy");
  const { items } = useWorkplans();
  const copyFrom = copyId ? items?.find((x) => x.id === copyId) : undefined;

  return (
    <>
      <PageHeader title="작업계획서 등록" actions={<BackButton />} />
      {!copyId && (
        <Segmented
          className="mt-5"
          aria-label="등록 방식"
          value={mode}
          onChange={(v) => router.replace(v === "bulk" ? "/workplan/new?mode=bulk" : "/workplan/new")}
          options={[
            { value: "single", label: "한 건 등록" },
            { value: "bulk", label: "여러 건 한 번에 등록" },
          ]}
        />
      )}
      {mode === "bulk" ? (
        <WorkplanBulk />
      ) : copyId ? (
        items === undefined ? (
          <Loading />
        ) : copyFrom ? (
          <WorkplanForm key={copyFrom.id} copyFrom={copyFrom} />
        ) : (
          <Panel>
            <EmptyState>복사할 작업계획서를 찾을 수 없습니다.</EmptyState>
          </Panel>
        )
      ) : (
        <WorkplanForm />
      )}
    </>
  );
}

/** /workplan/[id]/edit */
export function WorkplanEditPage() {
  const { id } = useParams<{ id: string }>();
  const { items } = useWorkplans();
  const item = items?.find((x) => String(x.id) === String(id));
  return (
    <>
      <PageHeader title="작업계획서 수정" actions={<BackButton />} />
      {items === undefined ? (
        <Loading />
      ) : item ? (
        <WorkplanForm key={item.id} initial={item} />
      ) : (
        <Panel>
          <EmptyState>해당 작업계획서를 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.</EmptyState>
        </Panel>
      )}
    </>
  );
}
