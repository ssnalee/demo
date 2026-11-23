/**
 * 견적서·내역서 표에서 공종별 금액 모으기 (원본 estParseSheet / estHandleFiles).
 * 품명 칸과 금액 칸을 찾아 소계·합계·부가세 줄은 건너뛰고, 품명으로 공종을 맞춥니다.
 */
import { decodeKoreanText, parseCSVText } from "./csv";
import { estNum } from "./numbers";
import { pdfToSheets } from "./pdf";
import type { Sheet, SheetCell } from "./sheet";
import { readXlsx } from "./xlsx";

export const EST_KEYWORDS: [RegExp, string][] = [
  [/석면/, "석면 해체·제거"], [/폐기물|잔재|반출/, "폐기물 처리"], [/천장철거/, "천장 철거"], [/벽체철거|벽철거/, "벽체 철거"], [/바닥철거/, "바닥 철거"], [/철거|해체/, "내부 철거"],
  [/가설전기/, "가설전기"], [/가설사무|컨테이너|현장사무/, "가설사무실·창고"], [/펜스|울타리|가림막/, "가설울타리·가림막"], [/가설화장실/, "가설화장실"], [/가설용수/, "가설용수"],
  [/시스템비계/, "시스템비계"], [/이동식비계|틀비계|말비계|렌탈비계/, "이동식비계"], [/비계|작업발판/, "비계·작업발판"], [/낙하물|방망/, "낙하물방지망·안전방망"], [/안전난간|개구부/, "안전난간·개구부 덮개"], [/분진|방진/, "분진막·방진막"], [/보양/, "보양공사"], [/양중|곤돌라|호이스트|리프트|운반/, "양중·자재운반"], [/가설/, "가설공사"],
  [/탄소섬유|에폭시보강/, "탄소섬유·에폭시 보강"], [/앵커|코어|천공/, "앵커·코어 천공"], [/구조보강|보강/, "구조보강"], [/철근|콘크리트|레미콘|거푸집/, "철근콘크리트"], [/경량|M-?BAR|엠바|스터드|런너/i, "경량철골"], [/철골|H빔|형강/, "철골"], [/조적|벽돌|블록/, "조적"], [/용접|용단/, "용접·용단"],
  [/데코타일/, "데코타일"], [/에폭시/, "에폭시 바닥"], [/카페트|카펫/, "카펫"], [/온돌|난방배관|엑셀파이프/, "온돌난방"], [/석고/, "석고보드"], [/텍스|흡음/, "흡음텍스"], [/몰딩|걸레받이/, "몰딩·걸레받이"], [/단열|보온/, "단열"], [/돔/, "돔천장"],
  [/실리콘|코킹/, "실리콘·코킹"], [/방화문/, "방화문"], [/자동문/, "자동문"], [/셔터/, "셔터"], [/창호|샷시|새시|창문|PL창|시스템창/, "창호"], [/유리|거울/, "유리"],
  [/스프링클러/, "스프링클러"], [/소방전기|감지기|유도등|수신기/, "소방전기"], [/소방|소화/, "소방설비"], [/배연/, "배연창"], [/급배기|환기|덕트|후드|디퓨저/, "급배기"], [/냉난방|에어컨|냉방|난방|보일러|EHP|GHP/, "냉난방"], [/도시가스|가스/, "도시가스"], [/엘리베이터|승강기/, "엘리베이터"], [/자동제어/, "자동제어"],
  [/위생|양변기|세면|소변기|수전|샤워/, "위생기"], [/설비|배관|급수|배수|오수|우수|펌프/, "설비·배관"],
  [/CCTV|방송|스피커/i, "방송·CCTV"], [/출입통제|보안|도어락/, "출입통제·보안"], [/통신|LAN|랜|전화|인터넷|와이파이|UTP/i, "통신"], [/조명|등기구|LED|다운라이트|매입등|라인등/i, "조명"], [/전기|배선|콘센트|스위치|분전|전선|케이블|접지|배관입선/, "전기작업"],
  [/주방/, "주방가구"], [/붙박이/, "붙박이장"], [/의료커튼|큐비클/, "의료커튼"], [/블라인드|롤스크린|커튼/, "블라인드"], [/가구|수납|책상|의자|테이블/, "가구"], [/사인|간판|안내판|명판/, "사인물"], [/장애인|점자|안전손잡이/, "장애인시설"], [/조경|식재/, "조경"], [/청소/, "준공청소"],
  [/도장|페인트|도색|락카/, "도장"], [/도배|벽지/, "도배"], [/필름|시트지/, "필름"], [/바닥|장판|마루|PVC|륨/i, "바닥재"], [/미장|몰탈|모르타르|레미탈/, "미장"], [/방수/, "방수"], [/타일/, "타일"], [/석공|대리석|화강석|석재|인조석/, "석공사"],
  [/금속|스텐|SUS|철물|난간|핸드레일|각관/i, "금속"], [/목공|합판|각재|MDF|목재|문틀|목문|도어|문짝/i, "목공"], [/인테리어/, "인테리어"],
];
export const EST_OVERHEAD = /이윤|일반\s*관리비|공과\s*잡비|간접|산재|고용|보험료|안전관리비|퇴직|기타\s*경비|제\s*경비|국민연금|건강보험|노인장기/;
export const EST_SKIP =
  /소\s*계|합\s*계|총\s*계|누\s*계|^계$|부\s*가\s*가?\s*치?\s*세|VAT|절\s*사|단수\s*정리|원\s*단위|공급\s*가|총\s*공사비|총\s*액|도급\s*액|견적\s*금액|직접\s*공사비|순\s*공사비|재료비\s*계|노무비\s*계|^(직접|간접)?(재료비|노무비|경비)(계|합계|소계)?$|공사\s*원가|총\s*원가/i;

export const OVERHEAD_TRADE = "제경비 (간접비·이윤)";

/** 품명 → 공종. 현장 공종 목록(trades)에 그대로 있으면 우선 */
export function estMatchTrade(name: string, trades: string[]): string | null {
  const raw = String(name);
  if (trades.includes(raw)) return raw;
  const word = (raw.match(/[^\s]*공사/) || [])[0];
  if (word && word !== raw) {
    const w = estMatchTrade(word, trades);
    if (w) return w;
  }
  const c = raw.replace(/\s+/g, "");
  for (const [re, t] of EST_KEYWORDS) if (re.test(c)) return t;
  return null;
}

/** 파일 → 표 목록 (csv·xlsx·xlsm·pdf) */
export async function fileToSheets(file: File): Promise<Sheet[]> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (ext === "csv") return [{ name: file.name, rows: parseCSVText(decodeKoreanText(await file.arrayBuffer())) }];
  if (ext === "xlsx" || ext === "xlsm") return readXlsx(await file.arrayBuffer());
  if (ext === "xls")
    throw new Error(
      "옛날 엑셀(xls) 형식입니다. 엑셀에서 열어 [다른 이름으로 저장 → Excel 통합 문서(xlsx)]로 저장한 뒤 넣어 주세요.",
    );
  if (ext === "pdf") return pdfToSheets(await file.arrayBuffer());
  throw new Error("엑셀(xlsx) 또는 CSV 파일만 읽을 수 있습니다.");
}

/** 품명·금액 머리글 행 찾기 */
export function estFindHeader(rows: SheetCell[][]): { start: number; nameCol: number; amtCol: number } | null {
  const norm = (r: SheetCell[] | undefined) => (r || []).map((c) => String(c ?? "").replace(/\s/g, ""));
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const r = norm(rows[i]),
      nameCol = r.findIndex((c) =>
        /^(품명|품목|공종|명칭|항목|공사명|내용|세부공종|작업명|공종명|품명및규격|공종및품명|공사내용)$/.test(c),
      );
    if (nameCol < 0) continue;
    const r2 = norm(rows[i + 1]),
      len = Math.max(r.length, r2.length),
      labels: { top: string; sub: string }[] = [];
    let grp = "";
    for (let c = 0; c < len; c++) {
      if (r[c]) grp = r[c];
      labels.push({ top: r[c] || grp, sub: r2[c] || "" });
    }
    let amt = -1;
    for (let c = len - 1; c >= 0 && amt < 0; c--) if (/합계|총액|^계$/.test(labels[c].top) && /금액/.test(labels[c].sub)) amt = c;
    for (let c = len - 1; c >= 0 && amt < 0; c--) if (/금액|공급가|견적가/.test(r[c] || "")) amt = c;
    for (let c = len - 1; c >= 0 && amt < 0; c--) if (/금액/.test(r2[c] || "")) amt = c;
    for (let c = len - 1; c >= 0 && amt < 0; c--) if (/합계|총액/.test(r[c] || "")) amt = c;
    if (amt < 0) continue;
    return { start: i + (r2.some((c) => /단가|금액|수량/.test(c)) ? 2 : 1), nameCol, amtCol: amt };
  }
  return null;
}

export interface ParsedItem {
  name: string;
  amt: number;
}
export interface ParsedTrade {
  trade: string;
  amount: number;
  items: ParsedItem[];
}
export interface ParsedSheet {
  res: ParsedTrade[];
  /** 견적서에 적힌 합계(공급가) */
  reported: number;
  vat: number;
  /** 부가세 포함 합계 */
  grand: number;
  itemCount: number;
}
export type ParseMode = "auto" | "detail" | "summary" | "flat" | "headers";

interface Ent {
  kind: "over" | "head" | "item";
  clean: string;
  amt: number;
  t: string | null;
  numbered?: boolean;
}

export function estParseSheet(
  rows: SheetCell[][],
  trades: string[],
  opts: { strict?: boolean; mode?: ParseMode } = {},
): ParsedSheet | null {
  const h = estFindHeader(rows);
  if (!h) return null;
  const ents: Ent[] = [];
  let reported = 0,
    vat = 0,
    grand = 0;
  for (let i = h.start; i < rows.length; i++) {
    const row = rows[i] || [];
    let name = String(row[h.nameCol] ?? "").trim();
    if (!name)
      for (let c = Math.max(0, h.nameCol - 1); c < h.amtCol; c++) {
        const v = row[c];
        if (typeof v === "string" && v.trim() && isNaN(estNum(v))) {
          name = v.trim();
          break;
        }
      }
    if (!name || /^(품\s*명|공\s*종|명\s*칭|항\s*목)$/.test(name)) continue;
    const amt = estNum(row[h.amtCol]),
      clean = name.replace(/^\(?[\dIVXⅠ-Ⅻ]{1,3}[.)]\s*|^[가-하][.)]\s*|^[-·•※▶■□○●]\s*/, "").trim();
    if (EST_SKIP.test(clean.replace(/\s/g, ""))) {
      const cc = clean.replace(/\s/g, "");
      if (amt > 0) {
        if (/포함/.test(cc) && /합계|총계|총액|금액|공사비/.test(cc)) grand = Math.max(grand, amt);
        else if (/별도/.test(cc) && /합계|총계|총액|금액|공사비/.test(cc)) {
          if (amt > reported) reported = amt;
        } else if (/부가|VAT/i.test(cc)) vat = Math.max(vat, amt);
        else if (/합계|총계|공급가|총공사비|총액|견적금액|도급액/.test(cc) && amt > reported) reported = amt;
      }
      continue;
    }
    if (EST_OVERHEAD.test(clean)) {
      if (amt > 0) ents.push({ kind: "over", clean, amt, t: null });
      continue;
    }
    const t = estMatchTrade(clean, trades),
      numbered = /^\(?[\dIVXⅠ-Ⅻ]{1,3}[.)]|^[가-하][.)]/.test(name),
      head =
        (/(공사|공종)$/.test(clean.replace(/\s/g, "")) && clean.length <= 16) ||
        (t && trades.includes(clean)) ||
        (t && !(amt > 0) && (!opts.strict || numbered));
    if (head) ents.push({ kind: "head", clean, amt: amt > 0 ? amt : 0, t, numbered });
    else if (amt > 0) ents.push({ kind: "item", clean, amt, t });
  }
  let list = ents;
  const headAmt = ents.filter((e) => e.kind === "head" && e.amt > 0).length,
    items = ents.filter((e) => e.kind === "item").length;
  let flat = headAmt > 0 && headAmt >= (headAmt + items) * 0.6;
  if (opts.mode === "flat") flat = true;
  const cut = ents.findIndex((e) => e.kind === "head" && (e.numbered || !(e.amt > 0)));
  if (opts.mode === "detail" && cut > 0) list = ents.slice(cut);
  if (opts.mode === "summary" && cut > 0) {
    list = ents.slice(0, cut);
    flat = true;
  }
  if (opts.mode === "headers") {
    list = ents.filter((e) => e.kind === "over" || (e.kind === "head" && e.amt > 0));
    flat = true;
  }
  const groups: Record<string, { trade: string; items: ParsedItem[]; header: number }> = {},
    order: string[] = [];
  let section: string | null = null;
  const add = (t: string, kind: "h" | "i", name: string, amt: number) => {
    if (!groups[t]) {
      groups[t] = { trade: t, items: [], header: 0 };
      order.push(t);
    }
    if (kind === "h") groups[t].header += amt;
    else groups[t].items.push({ name, amt });
  };
  list.forEach((e) => {
    if (e.kind === "over") return add(OVERHEAD_TRADE, "i", e.clean, e.amt);
    if (flat) return add(e.t || (e.kind === "head" ? e.clean : "기타"), "i", e.clean, e.amt);
    if (e.kind === "head") {
      section = e.t || e.clean;
      if (e.amt > 0) add(section, "h", e.clean, e.amt);
      return;
    }
    add(section || e.t || "기타", "i", e.clean, e.amt);
  });
  const res = order
    .map((t) => {
      const g = groups[t],
        sum = g.items.reduce((x, y) => x + y.amt, 0);
      return {
        trade: t,
        amount: sum > 0 ? sum : g.header,
        items: g.items.length ? g.items : [{ name: t + " (소계)", amt: g.header }],
      };
    })
    .filter((x) => x.amount > 0);
  if (!reported && grand && vat) reported = grand - vat;
  return { res, reported, vat, grand, itemCount: res.reduce((x, y) => x + y.items.length, 0) };
}

/** 불러오기 결과 한 줄 (공종 × 파일) */
export interface ImportRow extends ParsedTrade {
  file: string;
}

export interface ImportMeta {
  file: string;
  reported: number;
  vat: number;
  grand: number;
  total: number;
}

export type ImportNote =
  | { file: string; error: string }
  | {
      file: string;
      error?: undefined;
      sheets: string[];
      trades: number;
      total: number;
      reported: number;
      vat: number;
      fixed: boolean;
      diff: boolean;
    };

/** 파일 하나를 읽어 공종별 금액으로 정리 (견적서 합계와 맞도록 여러 해석 중 가장 가까운 것을 고름) */
export async function analyzeEstimateFile(
  file: File,
  trades: string[],
): Promise<{ rows: ImportRow[]; meta?: ImportMeta; note: ImportNote }> {
  try {
    const sheets = (await fileToSheets(file))
      .map((sh) => ({ ...sh, parsed: estParseSheet(sh.rows, trades, { strict: sh.strict }) }))
      .filter((sh): sh is typeof sh & { parsed: ParsedSheet } => !!sh.parsed && sh.parsed.res.length > 0);
    if (!sheets.length) return { rows: [], note: { file: file.name, error: "품명·금액 칸을 찾지 못했습니다." } };
    let use = sheets.filter((sh) => !/총괄|집계|갑지|표지|요약|원가계산/.test(sh.name));
    if (!use.length) use = sheets;
    if (use.length > 1) {
      const best = use.reduce((a, b) => (b.parsed.itemCount > a.parsed.itemCount ? b : a));
      use = use.filter((sh) => sh === best || !/내역/.test(best.name));
    }
    const maxOf = (shs: typeof sheets, f: (p: ParsedSheet) => number) => Math.max(0, ...shs.map((sh) => f(sh.parsed) || 0));
    const reported = maxOf(use, (p) => p.reported) || maxOf(sheets, (p) => p.reported);
    const combine = (shs: typeof sheets, mode: ParseMode) => {
      const mg: Record<string, ParsedTrade> = {};
      shs.forEach((sh) => {
        const pr = mode === "auto" ? sh.parsed : estParseSheet(sh.rows, trades, { strict: sh.strict, mode });
        if (!pr) return;
        pr.res.forEach((r) => {
          if (!mg[r.trade]) mg[r.trade] = { trade: r.trade, amount: 0, items: [] };
          mg[r.trade].amount += r.amount;
          mg[r.trade].items.push(...r.items);
        });
      });
      return { mg, total: Object.values(mg).reduce((a, x) => a + x.amount, 0) };
    };
    let pick = combine(use, "auto"),
      fixed = false;
    if (reported > 0 && Math.abs(pick.total - reported) > reported * 0.005) {
      const cands: ReturnType<typeof combine>[] = [];
      [use, ...sheets.map((sh) => [sh])].forEach((shs) =>
        (["auto", "detail", "summary", "flat", "headers"] as const).forEach((mode) => {
          const c = combine(shs, mode);
          if (c.total > 0) cands.push(c);
        }),
      );
      const best = cands.reduce((a, b) => (Math.abs(b.total - reported) < Math.abs(a.total - reported) ? b : a), pick);
      if (best !== pick && Math.abs(best.total - reported) < Math.abs(pick.total - reported)) {
        pick = best;
        fixed = true;
      }
    }
    const list = Object.values(pick.mg),
      total = list.reduce((s, x) => s + x.amount, 0);
    const vat = maxOf(use, (p) => p.vat) || maxOf(sheets, (p) => p.vat),
      grand = maxOf(use, (p) => p.grand) || maxOf(sheets, (p) => p.grand);
    const diff = !!reported && Math.abs(reported - total) > Math.max(1000, reported * 0.005);
    return {
      rows: list.map((x) => ({ ...x, file: file.name })),
      meta: { file: file.name, reported, vat, grand, total },
      note: { file: file.name, sheets: use.map((s) => s.name), trades: list.length, total, reported, vat, fixed, diff },
    };
  } catch (err) {
    return { rows: [], note: { file: file.name, error: err instanceof Error ? err.message : String(err) } };
  }
}

export interface ContractFromImport {
  supply: number;
  vat: number;
  total: number;
  rate: number;
  files: string[];
  guessVat: boolean;
}

/** 발주처 견적서 합계로 계약금액(공급가·부가세) 계산 */
export function estContractFromImport(
  list: { file: string; amount: number }[],
  metas: ImportMeta[],
  vatIn: boolean,
  vr: number,
): ContractFromImport | null {
  const files = [...new Set(list.map((r) => r.file))];
  let supply = 0,
    vat = 0,
    guess = false;
  files.forEach((f) => {
    const m: Partial<ImportMeta> = metas.find((x) => x.file === f) || {},
      rowsSum = list.filter((r) => r.file === f).reduce((t, r) => t + r.amount, 0);
    let sup = m.reported ? Math.round(m.reported / (vatIn ? 1 + vr : 1)) : rowsSum;
    if (Math.abs(sup - rowsSum) > Math.max(1000, sup * 0.005)) sup = rowsSum;
    let v = m.vat || (m.grand && m.grand > sup ? m.grand - sup : 0);
    if (!v) {
      v = Math.round(sup * vr);
      if (!vatIn) guess = true;
    }
    supply += sup;
    vat += v;
  });
  if (!supply) return null;
  const rate = Math.abs(vat / supply - 0.1) < 0.002 ? 10 : Math.round((vat / supply) * 1000) / 10;
  return { supply, vat, total: supply + vat, rate: rate === 0 ? 0 : rate, files, guessVat: guess };
}
