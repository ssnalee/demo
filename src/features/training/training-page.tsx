"use client";

import { PageHeader, scrollToId } from "@/components/ui";
import { useState } from "react";
import { TRAINING_FORM_ID, TrainingForm } from "./components/training-form";
import { TrainingTable } from "./components/training-table";
import type { Training } from "./types";

export function TrainingPage() {
  const [editing, setEditing] = useState<Training | null>(null);
  return (
    <>
      <PageHeader title="안전교육 기록" />
      <TrainingForm editing={editing} onDone={() => setEditing(null)} />
      <TrainingTable
        onEdit={(x) => {
          setEditing({ ...x });
          scrollToId(TRAINING_FORM_ID);
        }}
      />
    </>
  );
}
