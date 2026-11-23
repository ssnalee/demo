"use client";

import { BulkEntryTable, useBulkRows } from "@/components/data";
import { Button, Disclosure, Field, Input, Select, Textarea, toast, confirmDialog } from "@/components/ui";
import { newId } from "@/lib/id";
import { useGroupedMasters } from "@/lib/storage/masters";
import { read, write } from "@/lib/storage/store";
import { useState } from "react";
import { WORKER_BULK_CARRY, WORKER_BULK_COLUMNS } from "../config";
import { parseWorkerPaste, workerDupKey } from "../lib";
import { WORKER_STATUSES, type Worker } from "../types";

/** 근로자 여러 명 한 번에 등록 (원본 wkParsePaste / wkApplyDefaults / wkBulkSave) */
export function WorkerBulk() {
  const { trades, tradeGroups } = useGroupedMasters();
  const state = useBulkRows(WORKER_BULK_COLUMNS, WORKER_BULK_CARRY);
  const [paste, setPaste] = useState("");
  const [def, setDef] = useState({ company: "", trade: "", dailyWage: "" });

  const parse = () => {
    const text = paste.trim();
    if (!text) return toast("붙여넣을 명단이 없습니다.", "danger");
    const out = parseWorkerPaste(text, trades);
    if (!out.length) return toast("명단에서 이름을 찾지 못했습니다. 한 줄에 한 명씩 붙여넣어 주세요.", "danger");
    const company = def.company.trim();
    const kept = state.rows
      .filter((r) => r.name?.trim())
      .map((r) => {
        const { _key, ...d } = r;
        void _key;
        return d;
      });
    state.reset([
      ...kept,
      ...out.map((r) => ({
        name: r.name,
        company: r.company || company,
        trade: r.trade || def.trade,
        phone: r.phone,
        dailyWage: r.dailyWage || def.dailyWage,
      })),
    ]);
    setPaste("");
    toast(`${out.length}명을 표로 옮겼습니다. 확인한 뒤 '모두 저장'을 누르세요.`);
  };

  const applyDefaults = () => {
    const c = def.company.trim();
    state.rows.forEach((r) => {
      if (c) state.update(r._key, "company", c);
      if (def.trade) state.update(r._key, "trade", def.trade);
      if (def.dailyWage) state.update(r._key, "dailyWage", def.dailyWage);
    });
  };

  const save = async () => {
    const rows = state.rows.filter((r) => r.name?.trim());
    if (!rows.length) return toast("저장할 근로자가 없습니다. 성명을 입력해 주세요.", "danger");
    const list = read<Worker>("workers");
    const have = new Set(list.map(workerDupKey));
    const seen = new Set<string>();
    const add = rows.filter((r) => {
      const k = workerDupKey({ name: r.name, company: r.company });
      if (have.has(k) || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    const skip = rows.length - add.length;
    if (!add.length) return toast("모두 이미 등록된 근로자입니다. (같은 이름·같은 업체)", "danger");
    if (!(await confirmDialog({ title: `근로자 ${add.length}명을 저장할까요?`, message: skip ? `이미 등록된 ${skip}명은 건너뜁니다.` : undefined, confirmText: "저장" }))) return;
    const created: Worker[] = add.map((r) => ({
      id: newId(),
      name: r.name.trim(),
      company: (r.company || "").trim(),
      trade: r.trade || trades[0] || "",
      phone: (r.phone || "").trim(),
      dailyWage: Math.max(0, Number(r.dailyWage) || 0),
      status: WORKER_STATUSES[0],
    }));
    // 원본처럼 한 명씩 맨 앞에 추가 (마지막 줄이 맨 위)
    write("workers", [...created.reverse(), ...list]);
    state.reset();
    toast(`근로자 ${add.length}명을 등록했습니다.`);
  };

  return (
    <Disclosure title="근로자 여러 명 한 번에 등록" description="엑셀·카톡 명단을 붙여넣거나 표에 여러 줄을 적어 한 번에 저장합니다">
      <Field
        label={
          <>
            명단 붙여넣기 <span className="font-normal text-sub">(한 줄에 한 명 · 성명, 업체, 공종, 연락처, 노임 순서는 상관없음)</span>
          </>
        }
      >
        <Textarea
          rows={3}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={"김철수\t대한인테리어\t목공\t010-1234-5678\t250000\n박영호 대한인테리어 타일 23만"}
        />
      </Field>
      <div className="grid grid-cols-1 items-end gap-x-3 sm:grid-cols-[1.2fr_1fr_.8fr_auto]">
        <Field label="기본 소속업체">
          <Input list="company-names" placeholder="비어 있는 칸에 채움" value={def.company} onChange={(e) => setDef({ ...def, company: e.target.value })} />
        </Field>
        <Field label="기본 공종">
          <Select groups={tradeGroups} placeholder="선택 안 함" value={def.trade} onChange={(e) => setDef({ ...def, trade: e.target.value })} />
        </Field>
        <Field label="기본 1일 노임">
          <Input type="number" min={0} step={1000} placeholder="0" value={def.dailyWage} onChange={(e) => setDef({ ...def, dailyWage: e.target.value })} />
        </Field>
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Button onClick={parse}>표로 옮기기</Button>
          <Button onClick={applyDefaults}>모든 줄에 기본값</Button>
        </div>
      </div>
      <BulkEntryTable columns={WORKER_BULK_COLUMNS} state={state} />
      <div className="mt-3 flex justify-end">
        <Button variant="primary" onClick={save}>
          모두 저장
        </Button>
      </div>
    </Disclosure>
  );
}
