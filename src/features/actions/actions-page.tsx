"use client";

import { PageHeader, scrollToId } from "@/components/ui";
import { useState } from "react";
import { ACTION_FORM_ID, ActionForm } from "./components/action-form";
import { ActionTable } from "./components/action-table";
import type { Action } from "./types";

export function ActionsPage() {
  const [editing, setEditing] = useState<Action | null>(null);
  return (
    <>
      <PageHeader title="개선조치 관리" description="위험성평가에서 등록된 개선사항을 담당자·기한·상태별로 추적합니다." />
      <ActionForm editing={editing} onDone={() => setEditing(null)} />
      <ActionTable
        onEdit={(x) => {
          setEditing({ ...x });
          scrollToId(ACTION_FORM_ID);
        }}
      />
    </>
  );
}
