"use client";

import { Button, Notice, PageHeader, Stat, StatGroup, scrollToId } from "@/components/ui";
import { useList } from "@/lib/storage/hooks";
import { useState } from "react";
import { DefectBulk } from "./components/defect-bulk";
import { DEFECT_FORM_ID, DefectForm } from "./components/defect-form";
import { DefectTable } from "./components/defect-table";
import { defectCounts, type Defect } from "./types";

export function DefectsPage() {
  const [editing, setEditing] = useState<Defect | null>(null);
  const [formKey, setFormKey] = useState(0);
  const c = defectCounts(useList<Defect>("defects"));
  return (
    <>
      <PageHeader
        title="준공 후 하자보수 관리"
        description="준공 후 접수된 하자의 위치·내용·담당업체·보수 일정과 진행상태를 관리합니다."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormKey((k) => k + 1);
              scrollToId(DEFECT_FORM_ID);
            }}
          >
            새 하자 접수
          </Button>
        }
      />
      <Notice>
        이 메뉴는 준공 후 하자 접수 및 보수 진행상태 관리용입니다. 보수비용은 관리하지 않습니다. 완료된 하자도 이력으로 보관할 수
        있습니다.
      </Notice>
      <DefectBulk />
      <StatGroup>
        <Stat label="전체 접수" value={`${c.total}건`} />
        <Stat label="접수·보수예정" value={`${c.pending}건`} />
        <Stat label="보수 진행 중" value={`${c.progress}건`} />
        <Stat label="보수 완료" value={`${c.done}건`} tone="success" />
      </StatGroup>
      <DefectForm key={formKey} editing={editing} onDone={() => setEditing(null)} />
      <DefectTable
        onEdit={(x) => {
          setEditing({ ...x });
          scrollToId(DEFECT_FORM_ID);
        }}
      />
    </>
  );
}
