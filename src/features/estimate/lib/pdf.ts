/**
 * 라이브러리 없이 PDF에서 글자 줄 추출 (견적서용, 인터넷 없이 동작).
 * 객체·스트림을 직접 읽고 FlateDecode는 DecompressionStream으로 풉니다.
 * 스캔(이미지) PDF와 암호화 PDF는 읽을 수 없습니다.
 */
import { estNum } from "./numbers";
import type { Sheet, SheetCell } from "./sheet";

export function u8ToBin(u8: Uint8Array): string {
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000) as unknown as number[]);
  return s;
}

export async function pdfInflate(bytes: Uint8Array, raw = false): Promise<Uint8Array> {
  const ds = new DecompressionStream(raw ? "deflate-raw" : "deflate"),
    w = ds.writable.getWriter(),
    r = ds.readable.getReader(),
    chunks: Uint8Array[] = [];
  w.write(bytes.slice()).catch(() => {});
  w.close().catch(() => {});
  try {
    for (;;) {
      const { value, done } = await r.read();
      if (done) break;
      chunks.push(value);
    }
  } catch {
    if (!chunks.length && !raw) return pdfInflate(bytes.subarray(2), true);
  }
  const out = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
  let o = 0;
  chunks.forEach((c) => {
    out.set(c, o);
    o += c.length;
  });
  return out;
}

interface PdfObj {
  dict: string;
  stream: { start: number; len: number | null; lenRef: number | null } | null;
}

interface PdfFont {
  decode: (s: string) => string;
}

export async function pdfToSheets(buf: ArrayBuffer): Promise<Sheet[]> {
  const u8 = new Uint8Array(buf),
    bin = u8ToBin(u8);
  if (bin.indexOf("%PDF") < 0 || bin.indexOf("%PDF") > 1024) throw new Error("PDF 파일 형식이 아닙니다.");
  if (/\/Encrypt\s*\d+\s+\d+\s+R|\/Encrypt\s*<</.test(bin))
    throw new Error("암호가 걸린 PDF라서 읽을 수 없습니다. 암호를 풀어서 다시 저장하거나 엑셀 파일을 요청해 주세요.");
  const objs: Record<number, PdfObj> = {},
    re = /(\d+)\s+(\d+)\s+obj\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(bin))) {
    const id = +m[1],
      start = re.lastIndex,
      endGuess = bin.indexOf("endobj", start),
      seg = bin.slice(start, endGuess < 0 ? bin.length : endGuess),
      si = seg.search(/\bstream\r?\n/);
    const dict = si >= 0 ? seg.slice(0, si) : seg;
    let stream: PdfObj["stream"] = null,
      end = endGuess < 0 ? bin.length : endGuess;
    if (si >= 0) {
      let ds = start + si + 6;
      if (bin[ds] === "\r") ds++;
      if (bin[ds] === "\n") ds++;
      const lm = /\/Length\s+(\d+)(\s+\d+\s+R)?/.exec(dict);
      stream = { start: ds, len: lm && !lm[2] ? +lm[1] : null, lenRef: lm && lm[2] ? +lm[1] : null };
      if (stream.len != null) {
        const e2 = bin.indexOf("endobj", ds + stream.len);
        if (e2 > 0) end = e2;
      }
    }
    objs[id] = { dict: dict.trim(), stream };
    re.lastIndex = end;
  }

  const streamBytes = async (o: PdfObj | undefined): Promise<Uint8Array | null> => {
    if (!o || !o.stream) return null;
    const { start, lenRef } = o.stream;
    let len = o.stream.len;
    if (len == null && lenRef != null && objs[lenRef]) len = parseInt(objs[lenRef].dict, 10);
    if (!(len != null && len > 0)) {
      const e = bin.indexOf("endstream", start);
      len = (e < 0 ? bin.length : e) - start;
    }
    const data = u8.subarray(start, start + len);
    if (/\/FlateDecode|\/Fl\b/.test(o.dict)) return pdfInflate(data);
    if (/\/Filter/.test(o.dict)) return null;
    return data;
  };

  // 객체 스트림(ObjStm) 풀기
  for (const key of Object.keys(objs)) {
    const o = objs[+key];
    if (!/\/Type\s*\/ObjStm/.test(o.dict)) continue;
    const data = await streamBytes(o);
    if (!data) continue;
    const t = u8ToBin(data),
      N = +(/\/N\s+(\d+)/.exec(o.dict) || [])[1],
      F = +(/\/First\s+(\d+)/.exec(o.dict) || [])[1];
    const nums = t.slice(0, F).trim().split(/\s+/).map(Number);
    for (let i = 0; i < N; i++) {
      const oid = nums[2 * i],
        off = nums[2 * i + 1],
        next = i + 1 < N ? nums[2 * i + 3] : t.length - F;
      if (!objs[oid]) objs[oid] = { dict: t.slice(F + off, F + next).trim(), stream: null };
    }
  }

  const refOf = (d: string | undefined | null, k: string) => {
    const r = new RegExp("/" + k + "\\s+(\\d+)\\s+\\d+\\s+R").exec(d || "");
    return r ? +r[1] : null;
  };
  const balanced = (str: string, i: number) => {
    let depth = 0;
    for (let j = i; j < str.length; j++) {
      if (str[j] === "<" && str[j + 1] === "<") {
        depth++;
        j++;
      } else if (str[j] === ">" && str[j + 1] === ">") {
        depth--;
        j++;
        if (!depth) return str.slice(i, j + 1);
      }
    }
    return str.slice(i);
  };
  const dictVal = (d: string | null | undefined, k: string): string | null => {
    const r = new RegExp("/" + k + "\\s*(<<|\\d+\\s+\\d+\\s+R)").exec(d || "");
    if (!r || !d) return null;
    if (r[1] === "<<") return balanced(d, r.index + r[0].length - 2);
    return objs[+r[1].split(/\s+/)[0]]?.dict || null;
  };

  const pages: { d: string; res: string | null }[] = [];
  const walk = (id: number, res: string | null, seen = new Set<number>()) => {
    if (seen.has(id)) return;
    seen.add(id);
    const o = objs[id];
    if (!o) return;
    const d = o.dict,
      r2 = dictVal(d, "Resources") || res;
    if (/\/Type\s*\/Pages\b/.test(d)) {
      const k = /\/Kids\s*\[([^\]]*)\]/.exec(d);
      if (k) [...k[1].matchAll(/(\d+)\s+\d+\s+R/g)].forEach((x) => walk(+x[1], r2, seen));
    } else if (/\/Type\s*\/Page\b/.test(d)) pages.push({ d, res: r2 });
  };
  const roots = [...bin.matchAll(/\/Root\s+(\d+)\s+\d+\s+R/g)];
  if (roots.length) {
    const cat = objs[+roots[roots.length - 1][1]];
    const pid = refOf(cat?.dict, "Pages");
    if (pid != null) walk(pid, null);
  }
  if (!pages.length)
    Object.keys(objs)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((id) => {
        const d = objs[id].dict;
        if (/\/Type\s*\/Page\b/.test(d)) pages.push({ d, res: dictVal(d, "Resources") });
      });

  const fontCache: Record<number, PdfFont> = {};
  const loadFont = async (id: number): Promise<PdfFont> => {
    if (fontCache[id]) return fontCache[id];
    const d = objs[id]?.dict || "";
    const type0 = /\/Subtype\s*\/Type0/.test(d);
    let map: Record<number, string> | null = null,
      codeLen = type0 ? 2 : 1;
    const tu = refOf(d, "ToUnicode");
    if (tu != null) {
      const b = await streamBytes(objs[tu]);
      if (b) {
        const c = pdfParseCMap(u8ToBin(b));
        map = c.map;
        if (c.codeLen) codeLen = c.codeLen;
      }
    }
    const f: PdfFont = {
      decode: (str) => {
        let out = "";
        for (let i = 0; i < str.length; i += codeLen) {
          let code = 0;
          for (let k = 0; k < codeLen; k++) code = code * 256 + (str.charCodeAt(i + k) || 0);
          const u = map ? map[code] : undefined;
          out += u !== undefined ? u : codeLen === 1 ? str[i] : "";
        }
        return out;
      },
    };
    return (fontCache[id] = f);
  };

  const pageLines: string[][] = [];
  for (const pg of pages) {
    const fonts: Record<string, PdfFont> = {},
      fd = dictVal(pg.res || "", "Font");
    if (fd) for (const x of fd.matchAll(/\/([^\s/<>[\]()]+)\s+(\d+)\s+\d+\s+R/g)) fonts[x[1]] = await loadFont(+x[2]);
    let refs: number[] = [];
    const ca = /\/Contents\s*\[([^\]]*)\]/.exec(pg.d);
    if (ca) refs = [...ca[1].matchAll(/(\d+)\s+\d+\s+R/g)].map((x) => +x[1]);
    else {
      const r1 = refOf(pg.d, "Contents");
      if (r1 != null) refs = [r1];
    }
    let content = "";
    for (const r of refs) {
      const b = await streamBytes(objs[r]);
      if (b) content += u8ToBin(b) + "\n";
    }
    pageLines.push(pdfLines(pdfTextItems(content, fonts)));
  }
  if (!pageLines.some((ls) => ls.length))
    throw new Error(
      "글자를 찾지 못했습니다. 스캔(사진)으로 만든 PDF는 읽을 수 없으니 엑셀 파일이나 글자가 있는 PDF를 받아 주세요.",
    );

  const stripCur = (t: string) => t.replace(/^[₩\\]|원$/g, "");
  const isNum = (t: string) => /\d/.test(t) && /^-?[\d,]+(\.\d+)?$/.test(stripCur(t));
  const UNIT =
    /^(EA|ea|Ea|식|式|M|m|M2|m2|㎡|M3|m3|㎥|개|대|조|본|매|롤|인|일|SET|set|Set|개소|KG|kg|톤|TON|ton|L|자|평|회|LOT|lot|Lot|EA\.|공|품|장)$/;
  const toRows = (lines: string[]): SheetCell[][] => [
    ["품명", "금액"],
    ...lines.map((line): SheetCell[] => {
      const toks = line.split(/\s+/).filter(Boolean),
        nums = toks.filter(isNum);
      return [
        toks.filter((t) => !isNum(t) && !UNIT.test(t)).join(" "),
        nums.length ? estNum(stripCur(nums[nums.length - 1])) : "",
      ];
    }),
  ];
  const body: string[] = [],
    summary: string[] = [];
  pageLines.forEach((ls) => {
    (/총괄|집계표|갑\s*지|원가\s*계산/.test(ls.slice(0, 6).join(" ")) && pageLines.length > 1 ? summary : body).push(...ls);
  });
  const out: Sheet[] = [];
  if (body.length) out.push({ name: "내역 (PDF)", rows: toRows(body), strict: true });
  if (summary.length) out.push({ name: "총괄 (PDF)", rows: toRows(summary), strict: true });
  return out;
}

export function pdfParseCMap(t: string): { map: Record<number, string>; codeLen: number } {
  const map: Record<number, string> = {};
  let codeLen = 0;
  const cs = /begincodespacerange([\s\S]*?)endcodespacerange/.exec(t);
  if (cs) {
    const h = /<([0-9a-fA-F]+)>/.exec(cs[1]);
    if (h) codeLen = h[1].length / 2;
  }
  const dec = (h: string) => {
    if (h.length <= 2) return String.fromCharCode(parseInt(h, 16));
    let s = "";
    for (let i = 0; i + 4 <= h.length; i += 4) s += String.fromCharCode(parseInt(h.substr(i, 4), 16));
    return s;
  };
  for (const b of t.matchAll(/beginbfchar([\s\S]*?)endbfchar/g))
    for (const x of b[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g)) map[parseInt(x[1], 16)] = dec(x[2]);
  for (const b of t.matchAll(/beginbfrange([\s\S]*?)endbfrange/g))
    for (const x of b[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(?:<([0-9a-fA-F]+)>|\[([^\]]*)\])/g)) {
      const lo = parseInt(x[1], 16),
        hi = parseInt(x[2], 16);
      if (hi - lo > 65535) continue;
      if (x[3] !== undefined) {
        const base = dec(x[3]);
        for (let c = lo; c <= hi; c++) {
          const k = c - lo;
          map[c] = base.slice(0, -1) + String.fromCharCode(base.charCodeAt(base.length - 1) + k);
        }
      } else {
        const arr = [...x[4].matchAll(/<([0-9a-fA-F]+)>/g)].map((y) => dec(y[1]));
        arr.forEach((v, k) => (map[lo + k] = v));
      }
    }
  return { map, codeLen };
}

type Token =
  | { t: "str"; v: string }
  | { t: "num"; v: number }
  | { t: "name"; v: string }
  | { t: "op"; v: string }
  | { t: "[" }
  | { t: "]" };

const ESCAPES: Record<string, string> = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" };

export function* pdfTokens(s: string): Generator<Token> {
  let i = 0;
  const n = s.length,
    delim = /[\s/[\]<>()%{}]/;
  while (i < n) {
    const c = s[i];
    if (c === " " || c === "\n" || c === "\r" || c === "\t" || c === "\f" || c === "\0") {
      i++;
      continue;
    }
    if (c === "%") {
      while (i < n && s[i] !== "\n" && s[i] !== "\r") i++;
      continue;
    }
    if (c === "(") {
      let depth = 1,
        out = "";
      i++;
      while (i < n && depth) {
        const ch = s[i];
        if (ch === "\\") {
          i++;
          const e = s[i];
          if (ESCAPES[e] !== undefined) {
            out += ESCAPES[e];
            i++;
          } else if (e >= "0" && e <= "7") {
            let o = "";
            while (o.length < 3 && s[i] >= "0" && s[i] <= "7") {
              o += s[i];
              i++;
            }
            out += String.fromCharCode(parseInt(o, 8) & 255);
          } else if (e === "\r" || e === "\n") {
            i++;
            if (e === "\r" && s[i] === "\n") i++;
          } else {
            out += e;
            i++;
          }
          continue;
        }
        if (ch === "(") depth++;
        else if (ch === ")") {
          depth--;
          if (!depth) {
            i++;
            break;
          }
        }
        out += ch;
        i++;
      }
      yield { t: "str", v: out };
      continue;
    }
    if (c === "<" && s[i + 1] !== "<") {
      const j = s.indexOf(">", i);
      let h = s.slice(i + 1, j < 0 ? n : j).replace(/\s/g, "");
      if (h.length % 2) h += "0";
      let out = "";
      for (let k = 0; k < h.length; k += 2) out += String.fromCharCode(parseInt(h.substr(k, 2), 16));
      i = j < 0 ? n : j + 1;
      yield { t: "str", v: out };
      continue;
    }
    if (c === "<" || c === ">") {
      i += s[i + 1] === c ? 2 : 1;
      continue;
    }
    if (c === "[") {
      i++;
      yield { t: "[" };
      continue;
    }
    if (c === "]") {
      i++;
      yield { t: "]" };
      continue;
    }
    if (c === "{" || c === "}") {
      i++;
      continue;
    }
    if (c === "/") {
      let j = i + 1;
      while (j < n && !delim.test(s[j])) j++;
      yield { t: "name", v: s.slice(i + 1, j) };
      i = j;
      continue;
    }
    let j = i;
    while (j < n && !delim.test(s[j])) j++;
    if (j === i) {
      i++;
      continue;
    }
    const w = s.slice(i, j);
    i = j;
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(w)) yield { t: "num", v: parseFloat(w) };
    else {
      yield { t: "op", v: w };
      if (w === "BI") {
        const e = s.indexOf("EI", i);
        i = e < 0 ? n : e + 2;
      }
    }
  }
}

export interface PdfTextItem {
  x: number;
  y: number;
  s: string;
  size: number;
  w: number;
}

type Mat = number[];
type StackItem = Token | { t: "arr"; v: Token[] };

export function pdfTextItems(content: string, fonts: Record<string, PdfFont>): PdfTextItem[] {
  const items: PdfTextItem[] = [],
    gs: Mat[] = [];
  const mul = (a: Mat, b: Mat): Mat => [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
    a[4] * b[0] + a[5] * b[2] + b[4],
    a[4] * b[1] + a[5] * b[3] + b[5],
  ];
  let ctm: Mat = [1, 0, 0, 1, 0, 0],
    tm: Mat = [1, 0, 0, 1, 0, 0],
    tlm: Mat = [1, 0, 0, 1, 0, 0],
    font: string | null = null,
    size = 10,
    leading = 0,
    stack: StackItem[] = [],
    arr: Token[] | null = null;
  const emit = (text: string) => {
    if (!text || !text.trim()) return;
    const mm = mul(tm, ctm),
      sc = Math.sqrt(Math.abs(mm[0] * mm[3] - mm[1] * mm[2])) || 1,
      units = [...text].reduce((a, ch) => a + (ch.charCodeAt(0) > 0x1100 ? 1 : 0.55), 0),
      fs = Math.abs(size * sc) || 10;
    items.push({ x: mm[4], y: mm[5], s: text, size: fs, w: units * fs });
    const w = units * size;
    tm = [tm[0], tm[1], tm[2], tm[3], tm[4] + w * tm[0], tm[5] + w * tm[1]];
  };
  const dec = (str: string) => {
    const f = font ? fonts[font] : undefined;
    return f ? f.decode(str) : str;
  };
  const nl = () => {
    tlm = mul([1, 0, 0, 1, 0, -leading], tlm);
    tm = tlm.slice();
  };
  for (const tk of pdfTokens(content)) {
    if (tk.t === "[") {
      arr = [];
      continue;
    }
    if (tk.t === "]") {
      stack.push({ t: "arr", v: arr || [] });
      arr = null;
      continue;
    }
    if (arr) {
      if (tk.t !== "op") arr.push(tk);
      continue;
    }
    if (tk.t !== "op") {
      stack.push(tk);
      continue;
    }
    const op = tk.v,
      nums = stack.flatMap((x) => (x.t === "num" ? [x.v] : [])),
      str = stack.find((x): x is { t: "str"; v: string } => x.t === "str");
    switch (op) {
      case "q":
        gs.push(ctm.slice());
        break;
      case "Q":
        ctm = gs.pop() || [1, 0, 0, 1, 0, 0];
        break;
      case "cm":
        if (nums.length >= 6) ctm = mul(nums.slice(-6), ctm);
        break;
      case "BT":
        tm = [1, 0, 0, 1, 0, 0];
        tlm = tm.slice();
        break;
      case "Tf": {
        const nm = stack.find((x): x is { t: "name"; v: string } => x.t === "name");
        if (nm) font = nm.v;
        if (nums.length) size = nums[nums.length - 1];
        break;
      }
      case "TL":
        leading = nums[0] || 0;
        break;
      case "Tm":
        if (nums.length >= 6) {
          tm = nums.slice(-6);
          tlm = tm.slice();
        }
        break;
      case "Td":
      case "TD":
        if (nums.length >= 2) {
          const [tx, ty] = nums.slice(-2);
          if (op === "TD") leading = -ty;
          tlm = mul([1, 0, 0, 1, tx, ty], tlm);
          tm = tlm.slice();
        }
        break;
      case "T*":
        nl();
        break;
      case "Tj":
        if (str) emit(dec(str.v));
        break;
      case "'":
      case '"':
        nl();
        if (str) emit(dec(str.v));
        break;
      case "TJ": {
        const a = stack.find((x): x is { t: "arr"; v: Token[] } => x.t === "arr");
        if (a) {
          let buf = "";
          a.v.forEach((e) => {
            if (e.t === "str") buf += dec(e.v);
            else if (e.t === "num" && e.v < -250) buf += " ";
          });
          emit(buf);
        }
        break;
      }
    }
    stack = [];
  }
  return items;
}

/** 같은 높이의 글자 조각을 한 줄로 묶음 */
export function pdfLines(items: PdfTextItem[]): string[] {
  const sorted = items.slice().sort((a, b) => b.y - a.y || a.x - b.x),
    lines: { y: number; size: number; items: PdfTextItem[] }[] = [];
  let cur: (typeof lines)[number] | null = null;
  sorted.forEach((it) => {
    if (!cur || Math.abs(it.y - cur.y) > Math.max(2, Math.min(it.size, cur.size) * 0.45)) {
      cur = { y: it.y, size: it.size, items: [] };
      lines.push(cur);
    }
    cur.items.push(it);
  });
  return lines
    .map((l) => {
      const its = l.items.sort((a, b) => a.x - b.x);
      let out = "",
        end: number | null = null;
      its.forEach((it) => {
        if (end !== null && it.x - end > it.size * 0.35) out += " ";
        out += it.s;
        end = Math.max(end ?? -1e9, it.x + it.w);
      });
      return out.replace(/\s+/g, " ").trim();
    })
    .filter(Boolean);
}
