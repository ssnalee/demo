"use client";

import { Button, Disclosure, Field, Input, Muted, Select, toast } from "@/components/ui";
import { groupOptions, useMasters } from "@/lib/storage/masters";
import { useRef, useState } from "react";
import { analyzeEstimateFile, type ImportMeta, type ImportNote, type ImportRow } from "../lib/parse";
import { applyEstimateImport } from "../lib/store";

export const EST_IMPORT_ID = "est-import";
const FILE_INPUT_ID = "est-files";

/** 파일 불러오기 패널을 펼치고 파일 선택창 열기 */
export function openEstimateImport() {
  const box = document.getElementById(EST_IMPORT_ID);
  const d = box?.querySelector("details");
  if (d) d.open = true;
  box?.scrollIntoView({ behavior: "smooth" });
  setTimeout(() => document.getElementById(FILE_INPUT_ID)?.click(), 300);
}

interface EditRow {
  src: ImportRow;
  on: boolean;
  trade: string;
  amount: string;
}

export function EstimateImport() {
  const { trades } = useMasters();
  const [vat, setVat] = useState<"excl" | "incl">("excl");
  const [target, setTarget] = useState<"cost" | "quote">("cost");
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<ImportNote[]>([]);
  const [rows, setRows] = useState<EditRow[]>([]);
  const [metas, setMetas] = useState<ImportMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: File[]) => {
    setBusy(true);
    setRows([]);
    setNotes([]);
    const ns: ImportNote[] = [],
      rs: EditRow[] = [],
      ms: ImportMeta[] = [];
    for (const file of files) {
      const r = await analyzeEstimateFile(file, trades);
      ns.push(r.note);
      if (r.meta) ms.push(r.meta);
      r.rows.forEach((src) => rs.push({ src, on: true, trade: src.trade, amount: String(Math.round(src.amount)) }));
    }
    setNotes(ns);
    setRows(rs);
    setMetas(ms);
    setBusy(false);
  };

  const patch = (i: number, p: Partial<EditRow>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...p } : r)));

  const apply = async () => {
    const msg = await applyEstimateImport(
      rows
        .filter((r) => r.on)
        .map((r) => ({ file: r.src.file, trade: r.trade, amount: Number(r.amount) || 0, itemCount: r.src.items.length })),
      target,
      vat === "incl",
      metas,
    );
    if (msg === null) return;
    setRows([]);
    setNotes([]);
    setMetas([]);
    if (inputRef.current) inputRef.current.value = "";
    toast(msg);
  };

  const allOn = rows.length > 0 && rows.every((r) => r.on);

  return (
    <div id={EST_IMPORT_ID}>
      <Disclosure title="견적서 파일로 불러오기" description="엑셀·PDF 견적서나 내역서를 넣으면 공종별로 금액을 모아 정리합니다">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_.9fr_.8fr_1fr]">
          <Field label="견적서 파일 (여러 개 가능 · 엑셀, PDF, CSV)">
            <Input
              ref={inputRef}
              id={FILE_INPUT_ID}
              type="file"
              multiple
              accept=".xlsx,.xlsm,.csv,.xls,.pdf"
              onChange={(e) => {
                const fs = [...(e.target.files ?? [])];
                if (fs.length) void handleFiles(fs);
              }}
            />
          </Field>
          <Field label="견적서 금액 기준">
            <Select
              value={vat}
              onChange={(e) => setVat(e.target.value as "excl" | "incl")}
              options={[
                { value: "excl", label: "부가세 별도 (공급가)" },
                { value: "incl", label: "부가세 포함 → 공급가로 바꿔서 반영" },
              ]}
            />
          </Field>
          <Field label="이 금액을">
            <Select
              value={target}
              onChange={(e) => setTarget(e.target.value as "cost" | "quote")}
              options={[
                { value: "cost", label: "실행금액으로 (협력업체에서 받은 견적)" },
                { value: "quote", label: "견적금액으로 (발주처에 낸 견적서 · 계약금액 자동 입력)" },
              ]}
            />
          </Field>
          <div className="mb-4">
            <div className="text-[13px] font-semibold text-fg-2">중복 방지</div>
            <Muted className="pt-1.5 text-[12.5px] leading-normal">
              같은 파일은 다시 넣어도 덮어씁니다. 같은 공종을 여러 업체가 견적하면 <b>더하지 않고</b> 업체별로 비교합니다
              (기본: 가장 낮은 금액).
            </Muted>
          </div>
        </div>

        {busy && <Muted className="my-2.5">파일을 읽는 중입니다…</Muted>}
        {notes.map((n, i) => (
          <ImportNoteLine key={i} note={n} />
        ))}

        {rows.length > 0 && (
          <>
            <div className="mt-2.5 overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[640px] border-collapse text-[13px]">
                <thead className="bg-bg text-left text-[12.5px] text-sub">
                  <tr>
                    <th className="w-[34px] px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label="전체 선택"
                        checked={allOn}
                        onChange={(e) => setRows((rs) => rs.map((r) => ({ ...r, on: e.target.checked })))}
                      />
                    </th>
                    <th className="px-2 py-2 font-medium">공종 (바꿀 수 있음)</th>
                    <th className="px-2 py-2 font-medium">금액 (원)</th>
                    <th className="px-2 py-2 font-medium">세부 항목</th>
                    <th className="px-2 py-2 font-medium">파일</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-line-2 align-top">
                      <td className="px-3 py-2">
                        <input type="checkbox" aria-label="반영" checked={r.on} onChange={(e) => patch(i, { on: e.target.checked })} />
                      </td>
                      <td className="px-2 py-1.5">
                        <Select
                          compact
                          className="min-w-[140px]"
                          value={r.trade}
                          groups={groupOptions("trade", [...new Set([...trades, r.trade])])}
                          onChange={(e) => patch(i, { trade: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          compact
                          type="number"
                          className="min-w-[120px]"
                          value={r.amount}
                          onChange={(e) => patch(i, { amount: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <details>
                          <summary className="cursor-pointer text-fg-2">{r.src.items.length}개 보기</summary>
                          <ul className="mt-1 list-disc pl-4 text-xs text-fg-2">
                            {r.src.items.slice(0, 200).map((it, k) => (
                              <li key={k}>
                                {it.name} · {Math.round(it.amt).toLocaleString("ko-KR")}원
                              </li>
                            ))}
                          </ul>
                        </details>
                      </td>
                      <td className="px-2 py-2 text-sub">{r.src.file}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
              <Muted className="mr-auto">공종이 잘못 묶였으면 바꾸고, 빼고 싶은 줄은 체크를 해제하세요.</Muted>
              <Button variant="primary" onClick={apply}>
                견적·실행 목록에 반영
              </Button>
            </div>
          </>
        )}
      </Disclosure>
    </div>
  );
}

function ImportNoteLine({ note: n }: { note: ImportNote }) {
  const W = (v: number) => v.toLocaleString("ko-KR") + "원";
  return (
    <div className="my-1 text-[12.5px] text-sub">
      <b className="text-fg">{n.file}</b> ·{" "}
      {n.error !== undefined ? (
        <span className="text-warning">{n.error}</span>
      ) : (
        <>
          {n.sheets.join(", ")} · 공종 {n.trades}개 · 읽은 금액 {W(n.total)}
          {n.reported ? ` · 견적서 합계 ${W(n.reported)}` : ""}
          {n.vat ? ` · 부가세 ${W(n.vat)}` : ""}
          {n.fixed && !n.diff && <span className="text-success"> (겹치는 소계를 빼고 합계에 맞췄습니다)</span>}
          {n.diff && <span className="text-warning"> (합계와 차이가 있습니다. 아래에서 확인해 주세요)</span>}
        </>
      )}
    </div>
  );
}
