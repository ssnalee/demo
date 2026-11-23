/** 견적·실행 저장소 조작 (이벤트 핸들러에서 사용) */
import { confirmDelete, confirmDialog, alertDialog } from "@/components/ui";
import { catalogOf } from "@/constants/masters";
import { nowISO } from "@/lib/date";
import { newId } from "@/lib/id";
import { getMasters } from "@/lib/storage/masters";
import { read, write } from "@/lib/storage/store";
import { EST_MANUAL_FILE, type EstimateItem, type EstSettings } from "../types";
import { contractFromFiles, estCostOf, estFileList, estVatRate } from "./calc";
import { moneyKRW } from "./money";
import { estContractFromImport, type ImportMeta } from "./parse";

const KEY = "estimateExecutions";

/** 수정용 사본 (저장소 캐시 객체를 직접 바꾸지 않도록 깊은 복사) */
export const readEstimates = (): EstimateItem[] =>
  read<EstimateItem>(KEY).map((x) => {
    const c: EstimateItem = { ...x };
    if (x.sources) c.sources = x.sources.map((y) => ({ ...y }));
    if (x.quoteSrc) c.quoteSrc = { ...x.quoteSrc };
    return c;
  });
export const getEstSettings = (): EstSettings => read<EstSettings>("estSettings")[0] || {};
export const saveEstSettings = (st: EstSettings) => write<EstSettings>("estSettings", [st]);

/** 폼 저장: 비교견적이 있는 항목의 실행금액을 직접 고치면 '직접 입력'으로 전환 */
export function saveEstimateForm(input: Pick<EstimateItem, "id" | "trade" | "title" | "quote" | "cost" | "note">): boolean {
  const a = readEstimates();
  const old: Partial<EstimateItem> = (input.id && a.find((x) => x.id === input.id)) || {};
  const item: EstimateItem = { ...old, ...input, id: input.id || newId(), updatedAt: nowISO() };
  if (old.sources && old.sources.length && input.cost !== estCostOf(old)) {
    item.pick = "manual";
    item.manualCost = input.cost;
  }
  item.cost = estCostOf(item);
  const ix = a.findIndex((x) => x.id === item.id);
  if (ix >= 0) a[ix] = item;
  else a.push(item);
  write(KEY, a);
  return ix >= 0;
}

/** 비교견적 중 사용할 출처 선택 */
export function estPick(id: string, val: string) {
  const a = readEstimates(),
    x = a.find((v) => v.id === id);
  if (!x) return;
  x.pick = val;
  x.cost = estCostOf(x);
  x.updatedAt = nowISO();
  write(KEY, a);
}

/** 불러온 파일을 계산에 포함/제외 */
export function estToggleFile(kind: "cost" | "quote", file: string) {
  const a = readEstimates();
  const f = estFileList(a).find((v) => v.kind === kind && v.file === file);
  if (!f) return;
  const off = !f.off;
  a.forEach((x) => {
    if (kind === "cost") {
      let hit = false;
      (x.sources || []).forEach((y) => {
        if (y.file === file) {
          y.off = off;
          hit = true;
        }
      });
      if (hit) x.cost = estCostOf(x);
    } else {
      const qf = x.quoteSrc ? x.quoteSrc.file : x.quoteFrom;
      if (qf === file) {
        x.quoteSrc = { ...(x.quoteSrc || { file: qf, amount: Number(x.quote) || 0 }), off };
        x.quote = off ? 0 : x.quoteSrc.amount;
      }
    }
  });
  write(KEY, a);
  if (kind === "quote") {
    const st = getEstSettings(),
      from = contractFromFiles(st);
    if (off && from.includes(file) && st.contract) saveEstSettings({ ...st, contractStash: st.contract, contract: 0 });
    else if (!off && from.includes(file) && st.contractStash) {
      const n = { ...st, contract: st.contractStash };
      delete n.contractStash;
      saveEstSettings(n);
    }
  }
}

/** 불러온 파일과 그 파일로 넣은 금액 삭제 */
export async function estRemoveImported(kind: "cost" | "quote", file: string) {
  const label = kind === "cost" ? "실행금액" : "견적금액";
  if (
    !(await confirmDelete(
      `이 파일로 넣은 ${label}이 모두 지워집니다. (잠깐 빼두려면 [포함]을 눌러 제외하세요)\n다른 파일이나 직접 입력한 금액은 그대로 남습니다.`,
      `'${file}' 파일을 삭제할까요?`,
    ))
  )
    return;
  let a = readEstimates();
  a.forEach((x) => {
    if (kind === "cost" && x.sources) {
      x.sources = x.sources.filter((y) => y.file !== file);
      if (x.pick && !["sum", "manual"].includes(x.pick) && !x.sources.some((y) => y.id === x.pick)) x.pick = "";
      if (!x.sources.length) {
        delete x.sources;
        if (x.pick !== "manual") x.cost = 0;
        x.pick = "";
      } else if (x.sources.length === 1 && x.sources[0].file === EST_MANUAL_FILE) {
        x.cost = x.sources[0].amount;
        delete x.sources;
        x.pick = "";
      }
      x.cost = estCostOf(x);
    }
    if (kind === "quote" && (x.quoteSrc ? x.quoteSrc.file : x.quoteFrom) === file) {
      x.quote = 0;
      delete x.quoteFrom;
      delete x.quoteSrc;
    }
  });
  a = a.filter((x) => Number(x.quote) || Number(x.cost) || (x.sources && x.sources.length) || x.title);
  write(KEY, a);
  const st = getEstSettings();
  if (
    kind === "quote" &&
    contractFromFiles(st).includes(file) &&
    (await confirmDialog({
      title: "계약금액도 지울까요?",
      message: `계약금액도 이 파일(${file})에서 자동으로 넣은 금액입니다.`,
      confirmText: "지우기",
      cancelText: "남겨두기",
      danger: true,
    }))
  )
    saveEstSettings({ ...st, contract: 0, contractInput: 0, contractFrom: "" });
}

/** 카탈로그 순서로 정렬 (원본 sortByCatalog) */
function sortByCatalog(arr: string[]) {
  const order = catalogOf("trade").flatMap((g) => g[1]);
  return arr
    .map((v, i) => [v, i] as const)
    .sort((x, y) => {
      const a = order.indexOf(x[0]),
        b = order.indexOf(y[0]);
      return (a < 0 ? 9999 + x[1] : a) - (b < 0 ? 9999 + y[1] : b);
    })
    .map((x) => x[0]);
}

export interface ImportApplyRow {
  file: string;
  trade: string;
  /** 입력한 금액 (부가세 포함일 수 있음) */
  amount: number;
  itemCount: number;
}

/**
 * 불러온 견적서를 목록에 반영.
 * target=cost: 업체별 비교견적(sources)으로 추가 · target=quote: 견적금액으로 넣고 계약금액 자동 입력 제안
 * 반영했으면 결과 메시지, 취소했으면 null
 */
export async function applyEstimateImport(
  input: ImportApplyRow[],
  target: "cost" | "quote",
  vatIn: boolean,
  metas: ImportMeta[],
): Promise<string | null> {
  const now = nowISO(),
    vr = estVatRate(getEstSettings()) / 100;
  const rows = input
    .map((r) => ({ ...r, amount: Math.round((Number(r.amount) || 0) / (vatIn ? 1 + vr : 1)) }))
    .filter((r) => r.amount > 0 && r.trade);
  if (!rows.length) {
    await alertDialog({ title: "반영할 줄이 없습니다" });
    return null;
  }
  const g: Record<string, { file: string; trade: string; amount: number; count: number }> = {};
  rows.forEach((r) => {
    const k = r.file + "\u0001" + r.trade;
    if (!g[k]) g[k] = { file: r.file, trade: r.trade, amount: 0, count: 0 };
    g[k].amount += r.amount;
    g[k].count += r.itemCount;
  });
  const list = Object.values(g),
    total = list.reduce((x, r) => x + r.amount, 0);
  if (
    !(await confirmDialog(
      target === "cost"
        ? {
            title: `실행금액 ${list.length}건을 반영할까요?`,
            message: `합계 ${total.toLocaleString("ko-KR")}원\n· 같은 파일을 전에 넣었으면 그 값을 덮어씁니다.\n· 같은 공종에 다른 업체 견적이 있으면 더하지 않고 비교견적으로 넣습니다.`,
            confirmText: "반영",
          }
        : { title: `공종별 견적금액 ${list.length}건을 반영할까요?`, message: "같은 공종은 새 금액으로 바뀝니다.", confirmText: "반영" },
    ))
  )
    return null;

  const { trades } = getMasters();
  const newT = [...new Set(list.map((r) => r.trade))].filter((t) => !trades.includes(t));
  if (newT.length) write<string>("masterTrades", sortByCatalog([...trades, ...newT]));

  const a = readEstimates();
  let compared = 0;
  list.forEach((r) => {
    let it: EstimateItem | undefined = a.find((x) => x.trade === r.trade && !x.title) || a.find((x) => x.trade === r.trade);
    if (!it) {
      it = { id: newId(), trade: r.trade, title: "", quote: 0, cost: 0, note: "" };
      a.push(it);
    }
    if (target === "quote") {
      it.quote = r.amount;
      it.quoteFrom = r.file;
      it.quoteSrc = { file: r.file, amount: r.amount, off: false };
    } else {
      it.sources = it.sources || [];
      if (!it.sources.length && Number(it.cost) > 0)
        it.sources.push({ id: newId(), file: EST_MANUAL_FILE, amount: Number(it.cost), count: 0, at: now });
      const ex = it.sources.find((x) => x.file === r.file);
      if (ex) {
        ex.amount = r.amount;
        ex.count = r.count;
        ex.at = now;
        ex.off = false;
      } else it.sources.push({ id: newId(), file: r.file, amount: r.amount, count: r.count, at: now });
      const src = it.sources;
      if (it.pick && !["sum", "manual"].includes(it.pick) && !src.some((x) => x.id === it.pick)) it.pick = "";
      if (src.length > 1) compared++;
      it.cost = estCostOf(it);
    }
    it.updatedAt = now;
  });
  write("estimateExecutions", a);

  if (target === "quote") {
    const ct = estContractFromImport(list, metas, vatIn, vr);
    if (ct) {
      const st = getEstSettings(),
        old = Number(st.contract) || 0;
      const info =
        `공급가액  ${moneyKRW(ct.supply)}\n부가세    ${moneyKRW(ct.vat)}\n합계      ${moneyKRW(ct.total)}` +
        (ct.guessVat ? "\n(견적서에 부가세 줄이 없어 10%로 계산했습니다)" : "");
      let next: number | null = null,
        from = ct.files.join(", ");
      if (!old) {
        if (await confirmDialog({ title: "견적서 합계로 계약금액을 채울까요?", message: info, confirmText: "채우기", cancelText: "건너뛰기" }))
          next = ct.supply;
      } else if (old !== ct.supply) {
        if (
          await confirmDialog({
            title: "추가 공사·변경분인가요?",
            message: `지금 계약금액(공급가액)은 ${moneyKRW(old)}입니다.\n추가 공사·변경분이면 기존 금액에 더합니다.\n\n${info}`,
            confirmText: "기존 금액에 더하기",
            cancelText: "아니요",
          })
        ) {
          next = old + ct.supply;
          from = [st.contractFrom, from].filter(Boolean).join(" + ");
        } else if (
          await confirmDialog({
            title: `계약금액을 ${moneyKRW(ct.supply)}로 바꿀까요?`,
            message: `네고로 금액이 달라졌다면 지금 금액(${moneyKRW(old)})을 그대로 두세요.`,
            confirmText: "바꾸기",
            cancelText: "그대로 두기",
          })
        )
          next = ct.supply;
      }
      if (next !== null)
        saveEstSettings({ ...st, contract: next, contractInput: next, vatMode: "excl", vatRate: ct.rate, contractFrom: from });
    }
  }
  return (
    `${list.length}건을 반영했습니다.` +
    (compared
      ? `\n여러 업체 견적이 있는 공종 ${compared}개는 가장 낮은 금액을 실행금액으로 잡았습니다. 목록의 '견적 출처'에서 업체를 바꿀 수 있습니다.`
      : "")
  );
}
