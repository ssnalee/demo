"use client";

import { PageHeader, scrollToId } from "@/components/ui";
import { useState } from "react";
import { INCIDENT_FORM_ID, IncidentForm } from "./components/incident-form";
import { IncidentTable } from "./components/incident-table";
import type { Incident } from "./types";

export function IncidentPage() {
  const [editing, setEditing] = useState<Incident | null>(null);
  return (
    <>
      <PageHeader title="사고·아차사고 등록" />
      <IncidentForm editing={editing} onDone={() => setEditing(null)} />
      <IncidentTable
        onEdit={(x) => {
          setEditing({ ...x });
          scrollToId(INCIDENT_FORM_ID);
        }}
      />
    </>
  );
}
