"use client";

import { PageHeader, scrollToId } from "@/components/ui";
import { useState } from "react";
import { PERMIT_FORM_ID, PermitForm } from "./components/permit-form";
import { PermitTable } from "./components/permit-table";
import type { Permit } from "./types";

export function PermitPage() {
  const [editing, setEditing] = useState<Permit | null>(null);
  return (
    <>
      <PageHeader title="작업허가 관리" />
      <PermitForm editing={editing} onDone={() => setEditing(null)} />
      <PermitTable
        onEdit={(x) => {
          setEditing({ ...x });
          scrollToId(PERMIT_FORM_ID);
        }}
      />
    </>
  );
}
