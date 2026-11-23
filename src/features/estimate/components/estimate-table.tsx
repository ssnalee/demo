"use client";

import { Button, DataTable, Muted, Panel, RowActions, Select, toast, type Column, confirmDelete } from "@/components/ui";
import { BulkEditBar, useSelection, type BulkEditConfig } from "@/components/data";
import { cn } from "@/lib/cn";
import { today } from "@/lib/date";
import { downloadCSV } from "@/lib/download";
import { printTable } from "@/lib/print";
import { useCollection, useUiPref } from "@/lib/storage/hooks";
import { useMemo } from "react";
import { estCostOf, estimateSummary, estPickValue, estUsedLabel, estVatRate } from "../lib/calc";
import { moneyKRW, vatSplit } from "../lib/money";
import { estPick } from "../lib/store";
import { EST_VIEW_OPTIONS, type EstimateItem, type EstSettings, type EstView } from "../types";

/** 원본 BE_CFG.estimateTable */
const BULK_CONFIG: BulkEditConfig<EstimateItem> = {
  collection: "estimateExecutions",
  entityName: "견적·실행 항목",
  fields: [
    { key: "trade", label: "공종", type: "trade" },
    { key: "note", label: "비고", type: "text" },
  ],
};

type Row = EstimateItem & { __total?: boolean };

export function EstimateTable({ settings, onEdit }: { settings: EstSettings; onEdit: (x: EstimateItem) => void }) {
  const { items, remove } = useCollection<EstimateItem>("estimateExecutions");
  const [mode, setMode] = useUiPref<EstView>("estView", "cost");
  const ids = useMemo(() => items.map((x) => x.id), [items]);
  const selection = useSelection(ids);
  const s = estimateSummary(items, settings);
  const c = s.cost,
    contract = s.contract;

  const name = (x: EstimateItem) => (
    <>
      <b>{x.trade}</b>
      {x.title && <Muted>{x.title}</Muted>}
    </>
  );
  const manage = (x: EstimateItem) => (
    <RowActions
      onEdit={() => onEdit(x)}
      onDelete={async () => {
        if (!(await confirmDelete("이 견적·실행 항목을 삭제합니다. 되돌릴 수 없습니다."))) return;
        remove(x.id);
        toast("견적·실행 항목을 삭제했습니다.");
      }}
    />
  );
  const R = "text-right whitespace-nowrap tabular-nums";

  const columns: Column<Row>[] =
    mode === "cost"
      ? [
          { key: "trade", header: "공종", cell: (x) => (x.__total ? <b>실행 합계</b> : name(x)) },
          {
            key: "cost",
            header: "실행금액",
            className: R,
            cell: (x) => <b>{moneyKRW(x.__total ? c : estCostOf(x))}</b>,
          },
          {
            key: "ratio",
            header: "실행 비율",
            className: R,
            cell: (x) => (x.__total ? "100%" : (c ? ((estCostOf(x) / c) * 100).toFixed(1) : "0.0") + "%"),
          },
          {
            key: "src",
            header: "견적 출처",
            cell: (x) =>
              x.__total ? (
                <span className="text-sub">
                  {contract ? `계약 ${moneyKRW(contract)} 대비 ${((c / contract) * 100).toFixed(1)}%` : ""}
                </span>
              ) : (
                <SourceCell x={x} />
              ),
          },
          { key: "manage", header: "관리", className: "no-print", cell: (x) => (x.__total ? null : manage(x)) },
        ]
      : [
          { key: "trade", header: "공종", cell: name },
          { key: "quote", header: "견적금액", className: R, cell: (x) => moneyKRW(x.quote) },
          { key: "cost", header: "실행금액", className: R, cell: (x) => moneyKRW(estCostOf(x)) },
          {
            key: "profit",
            header: "예상이익",
            className: R,
            cell: (x) => {
              const z = (Number(x.quote) || 0) - estCostOf(x);
              return <b className={cn(z < 0 && "!text-danger")}>{moneyKRW(z)}</b>;
            },
          },
          {
            key: "rate",
            header: "이익률",
            className: R,
            cell: (x) => {
              const q = Number(x.quote) || 0;
              return q ? (((q - estCostOf(x)) / q) * 100).toFixed(1) + "%" : "-";
            },
          },
          { key: "src", header: "견적 출처", cell: (x) => <SourceCell x={x} /> },
          { key: "manage", header: "관리", className: "no-print", cell: manage },
        ];

  const rows: Row[] =
    mode === "cost" && items.length ? [...items, { ...items[0], id: "__total", __total: true }] : items;

  const print = () => {
    const heads =
      mode === "cost" ? ["공종", "세부항목", "실행금액", "실행 비율", "견적 출처"] : ["공종", "세부항목", "견적금액", "실행금액", "예상이익", "이익률", "견적 출처"];
    const body = items.map((x) => {
      const cc = estCostOf(x),
        q = Number(x.quote) || 0;
      return mode === "cost"
        ? [x.trade, x.title, moneyKRW(cc), (c ? ((cc / c) * 100).toFixed(1) : "0.0") + "%", estUsedLabel(x)]
        : [x.trade, x.title, moneyKRW(q), moneyKRW(cc), moneyKRW(q - cc), q ? (((q - cc) / q) * 100).toFixed(1) + "%" : "-", estUsedLabel(x)];
    });
    if (mode === "cost") body.push(["실행 합계", "", moneyKRW(c), "100%", contract ? `계약 ${moneyKRW(contract)} 대비 ${((c / contract) * 100).toFixed(1)}%` : ""]);
    printTable(
      "견적·실행 관리",
      heads,
      body,
      `계약(공급가) ${moneyKRW(s.quote)} · 실행 ${moneyKRW(s.cost)} · 예상 이익 ${moneyKRW(s.profit)} · 이익률 ${s.rate.toFixed(1)}%`,
    );
  };

  return (
    <Panel
      title="공종별 견적·실행 목록"
      actions={
        <div className="no-print flex flex-wrap gap-2">
          <Select
            compact
            className="w-auto"
            value={mode}
            options={EST_VIEW_OPTIONS}
            onChange={(e) => setMode(e.target.value as EstView)}
          />
          <Button onClick={() => exportEstimateCSV(items, settings)}>견적·실행 CSV</Button>
          <Button onClick={print}>인쇄 / PDF</Button>
        </div>
      }
    >
      <BulkEditBar config={BULK_CONFIG} selected={selection.selected} onClear={selection.clear} />
      <DataTable
        rows={rows}
        columns={columns}
        selection={selection}
        rowClassName={(x) => (x.__total ? "bg-bg font-semibold [&>td:first-child_input]:hidden" : undefined)}
      />
    </Panel>
  );
}

/** 견적 출처: 비교견적이 여러 개면 선택 */
function SourceCell({ x }: { x: EstimateItem }) {
  const all = x.sources || [];
  const src = all.filter((y) => !y.off);
  if (!src.length) return <span className="text-sub">{all.length ? "파일 제외됨" : "직접 입력"}</span>;
  if (src.length === 1 && x.pick !== "manual") return <span className="text-sub">{src[0].file}</span>;
  const sel = estPickValue(x);
  return (
    <>
      <Select compact className="max-w-[260px]" value={sel} onChange={(e) => estPick(x.id, e.target.value)}>
        {src.map((y) => (
          <option key={y.id} value={y.id}>
            {y.file} · {y.amount.toLocaleString("ko-KR")}원
          </option>
        ))}
        <option value="sum">모두 합산 · {src.reduce((t, y) => t + y.amount, 0).toLocaleString("ko-KR")}원</option>
        {x.pick === "manual" && <option value="manual">직접 입력 · {(Number(x.manualCost) || 0).toLocaleString("ko-KR")}원</option>}
      </Select>
      <div className="text-[11.5px] text-sub">비교견적 {src.length}개</div>
    </>
  );
}

export function exportEstimateCSV(items: EstimateItem[], settings: EstSettings) {
  const rows: (string | number)[][] = [["공종", "세부항목", "견적금액", "실행금액", "예상이익", "이익률", "실행 견적 출처", "비고"]];
  items.forEach((x) => {
    const q = Number(x.quote) || 0,
      c = estCostOf(x);
    rows.push([x.trade, x.title, q, c, q - c, (q ? ((q - c) / q) * 100 : 0).toFixed(1) + "%", estUsedLabel(x), x.note]);
  });
  const ct = Number(settings.contract) || 0;
  if (ct) {
    const cs = items.reduce((t, x) => t + estCostOf(x), 0),
      R = estVatRate(settings),
      qv = vatSplit(ct, "excl", R),
      cv = vatSplit(cs, "excl", R);
    rows.push(
      [],
      ["계약 (공급가액)", "", ct, cs, ct - cs, (ct ? ((ct - cs) / ct) * 100 : 0).toFixed(1) + "%", "", ""],
      [`부가세 ${R}%`, "", qv.vat, cv.vat, qv.vat - cv.vat, "", "", ""],
      ["합계 (부가세 포함)", "", qv.total, cv.total, qv.total - cv.total, "", "", ""],
    );
  }
  downloadCSV(rows, `견적실행관리_${today()}.csv`);
}
