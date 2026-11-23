"use client";

import { Button, Notice, PageHeader } from "@/components/ui";
import { useRouter } from "next/navigation";
import { WorkplanTable } from "./components/workplan-table";

/** /workplan — 목록 (등록·수정은 별도 페이지) */
export function WorkplanPage() {
  const router = useRouter();
  return (
    <>
      <PageHeader
        title="작업계획서 관리"
        description="작업일·층·공종별로 계획을 등록하고 작업 전 확인사항을 관리합니다."
        actions={
          <Button variant="primary" onClick={() => router.push("/workplan/new")}>
            + 작업계획서 등록
          </Button>
        }
      />
      <Notice>
        작업계획서는 현장 작업을 준비·조정하기 위한 기록입니다. 작업별 법정 작업계획서 작성 대상 여부와 필수 기재사항은 해당
        작업 및 관련 기준을 별도로 확인해야 합니다.
      </Notice>
      <WorkplanTable
        onEdit={(x) => router.push(`/workplan/${encodeURIComponent(x.id)}/edit`)}
      />
    </>
  );
}
