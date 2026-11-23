"use client";

import { BulkEntryTable, useBulkRows, type FieldSpec } from "@/components/data";
import { Button, Disclosure, Field, Input, Textarea, toast, confirmDialog } from "@/components/ui";
import { nowISO, today } from "@/lib/date";
import { newId } from "@/lib/id";
import { getMasters } from "@/lib/storage/masters";
import { read, write } from "@/lib/storage/store";
import { useState } from "react";
import { parseDefectPaste } from "../lib";
import { DEFECT_STATUSES, DEFECT_TYPES, type Defect } from "../types";

/** 원본 BULK.df */
const COLUMNS: FieldSpec[] = [
  { key: "floor", label: "층·구역", type: "floor" },
  { key: "trade", label: "공종", type: "trade" },
  { key: "location", label: "발생 위치", type: "text", placeholder: "예: 302호 화장실" },
  { key: "type", label: "하자 유형", type: "opts", options: [...DEFECT_TYPES] },
  { key: "content", label: "하자 내용", type: "text", placeholder: "하자 내용" },
  { key: "company", label: "보수업체", type: "company" },
  { key: "planDate", label: "보수 예정일", type: "date" },
  { key: "status", label: "상태", type: "opts", options: [...DEFECT_STATUSES] },
];
const CARRY = ["floor", "trade", "type", "company", "planDate", "status"];

export function DefectBulk() {
  const state = useBulkRows(COLUMNS, CARRY);
  const [paste, setPaste] = useState("");
  const [date, setDate] = useState(today);
  const [company, setCompany] = useState("");
  const [plan, setPlan] = useState("");

  const parse = () => {
    const text = paste.trim();
    if (!text) return toast("붙여넣을 하자 목록이 없습니다.", "danger");
    const { floors, trades } = getMasters();
    const out = parseDefectPaste(text, trades);
    const keep = state.rows
      .filter((r) => r.content.trim())
      .map((r) => {
        const { _key, ...d } = r;
        void _key;
        return d;
      });
    const comp = company.trim();
    state.reset([
      ...keep,
      ...out.map((r) => ({
        floor: r.floor && floors.includes(r.floor) ? r.floor : r.floor || floors[0] || "",
        trade: r.trade,
        location: r.location,
        type: r.type,
        content: r.content,
        company: comp,
        planDate: plan,
        status: plan ? "보수예정" : "접수",
      })),
    ]);
    setPaste("");
    toast(`하자 ${out.length}건을 표로 옮겼습니다. 층·유형이 맞는지 확인하고 '모두 접수'를 누르세요.`);
  };

  const save = async () => {
    const rows = state.rows.filter((r) => r.content.trim());
    if (!rows.length) return toast("접수할 하자가 없습니다. 하자 내용을 입력해 주세요.", "danger");
    const d = date || today();
    if (!(await confirmDialog({ title: `하자 ${rows.length}건을 접수할까요?`, message: `${d} 접수`, confirmText: "접수" }))) return;
    const { floors, trades } = getMasters();
    const now = nowISO();
    const list: Defect[] = rows.map((r) => ({
      id: newId(),
      date: d,
      floor: r.floor || floors[0] || "",
      trade: r.trade || trades[0] || "",
      location: r.location.trim(),
      type: r.type,
      company: r.company.trim(),
      contact: "",
      planDate: r.planDate,
      doneDate: "",
      status: r.status || "접수",
      content: r.content.trim(),
      action: "",
      note: "",
      updatedAt: now,
    }));
    // 원본은 한 건씩 unshift → 마지막 줄이 맨 위
    write("defects", [...list.reverse(), ...read<Defect>("defects")]);
    state.reset();
    toast(`하자 ${rows.length}건을 접수했습니다.`);
  };

  return (
    <Disclosure title="하자 여러 건 한 번에 접수" description="카톡·문자로 받은 하자 목록을 붙여넣거나 여러 줄을 적어 한 번에 저장합니다">
      <Field label="하자 목록 붙여넣기" hint="한 줄에 한 건 · 층·호수·하자 유형을 알아서 나눕니다">
        <Textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={"3층 302호 화장실 천장 누수\n5층 복도 조명 안 켜짐\n지하1층 주차장 벽 균열"}
        />
      </Field>
      <div className="grid grid-cols-1 items-end gap-x-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Field label="접수일">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="기본 보수업체">
          <Input list="company-names" placeholder="비어 있는 칸에 채움" value={company} onChange={(e) => setCompany(e.target.value)} />
        </Field>
        <Field label="기본 보수 예정일">
          <Input type="date" value={plan} onChange={(e) => setPlan(e.target.value)} />
        </Field>
        <div className="mb-4">
          <Button onClick={parse}>표로 옮기기</Button>
        </div>
      </div>
      <BulkEntryTable columns={COLUMNS} state={state} />
      <div className="mt-3 flex justify-end">
        <Button variant="primary" onClick={save}>
          모두 접수
        </Button>
      </div>
    </Disclosure>
  );
}
