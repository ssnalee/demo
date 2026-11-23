"use client";

import { PageHeader, scrollToId } from "@/components/ui";
import { useState } from "react";
import { INSPECTION_FORM_ID, InspectionForm } from "./components/inspection-form";
import { InspectionTable } from "./components/inspection-table";
import type { Inspection } from "./types";

export function InspectionPage() {
  const [editing, setEditing] = useState<Inspection | null>(null);
  return (
    <>
      <PageHeader title="안전점검 등록" />
      <InspectionForm editing={editing} onDone={() => setEditing(null)} />
      <InspectionTable
        onEdit={(x) => {
          setEditing({ ...x });
          scrollToId(INSPECTION_FORM_ID);
        }}
      />
    </>
  );
}
