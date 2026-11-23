"use client";

import { Button, Notice, PageHeader, scrollToId } from "@/components/ui";
import { useState } from "react";
import { WorkDiaryBulk } from "./components/workdiary-bulk";
import { WORKDIARY_FORM_ID, WorkDiaryForm, type WorkDiaryFormRequest } from "./components/workdiary-form";
import { WorkDiaryTable } from "./components/workdiary-table";
import type { WorkDiary } from "./types";

export function WorkdiaryPage() {
  const [request, setRequest] = useState<WorkDiaryFormRequest | null>(null);
  const open = (r: { kind: "new" } | { kind: "edit" | "copy"; item: WorkDiary }) => {
    setRequest((prev) => ({ ...r, seq: (prev?.seq ?? 0) + 1 }));
    scrollToId(WORKDIARY_FORM_ID);
  };
  return (
    <>
      <PageHeader
        title="작업일보 관리"
        description="작업계획과 연결하여 당일 실제 작업실적·투입인원·진행률·특이사항을 기록합니다."
        actions={<Button onClick={() => open({ kind: "new" })}>새 작업일보</Button>}
      />
      <Notice>
        작업일보는 실제 작업실적 기록입니다. 계획된 작업과 실제 작업이 다르면 실제 작업내용·인원·시간·진행률을 기준으로
        기록하고, 사고 및 법정 보고·원본 서류는 별도 절차에 따라 관리하십시오.
      </Notice>
      <WorkDiaryBulk />
      <WorkDiaryForm request={request} />
      <WorkDiaryTable
        onEdit={(item) => open({ kind: "edit", item: { ...item } })}
        onCopy={(item) => open({ kind: "copy", item: { ...item } })}
      />
    </>
  );
}
