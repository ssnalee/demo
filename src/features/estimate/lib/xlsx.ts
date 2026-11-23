/**
 * 라이브러리 없이 xlsx(zip + XML) 읽기.
 * zip 중앙 디렉터리를 직접 읽고, 압축은 브라우저 DecompressionStream('deflate-raw')로 풉니다.
 */
import type { Sheet, SheetCell } from "./sheet";

type EntryReader = (name: string) => Promise<string | null>;

export async function unzipEntries(buf: ArrayBuffer): Promise<EntryReader> {
  const dv = new DataView(buf),
    u8 = new Uint8Array(buf);
  let e = u8.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error("엑셀(xlsx) 파일 형식이 아닙니다.");
  const n = dv.getUint16(e + 10, true);
  let q = dv.getUint32(e + 16, true);
  const dir: Record<string, { method: number; csize: number; off: number }> = {};
  const td = new TextDecoder();
  for (let i = 0; i < n; i++) {
    const method = dv.getUint16(q + 10, true),
      csize = dv.getUint32(q + 20, true),
      nl = dv.getUint16(q + 28, true),
      xl = dv.getUint16(q + 30, true),
      cl = dv.getUint16(q + 32, true),
      off = dv.getUint32(q + 42, true);
    dir[td.decode(u8.subarray(q + 46, q + 46 + nl))] = { method, csize, off };
    q += 46 + nl + xl + cl;
  }
  return async (name) => {
    const f = dir[name];
    if (!f) return null;
    const ln = dv.getUint16(f.off + 26, true),
      lx = dv.getUint16(f.off + 28, true),
      st = f.off + 30 + ln + lx,
      data = u8.slice(st, st + f.csize);
    if (f.method === 0) return td.decode(data);
    return await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
  };
}

const colIdx = (ref: string | null) => {
  const m = /^([A-Z]+)/.exec(ref || "");
  let n = 0;
  if (m) for (const ch of m[1]) n = n * 26 + ch.charCodeAt(0) - 64;
  return n - 1;
};

export async function readXlsx(buf: ArrayBuffer): Promise<Sheet[]> {
  const get = await unzipEntries(buf);
  const X = (str: string) => new DOMParser().parseFromString(str, "application/xml");
  const tx = (el: Element) => [...el.getElementsByTagName("t")].map((t) => t.textContent ?? "").join("");
  const ssx = await get("xl/sharedStrings.xml");
  const ss = ssx ? [...X(ssx).getElementsByTagName("si")].map(tx) : [];
  const wbXml = await get("xl/workbook.xml");
  if (!wbXml) throw new Error("엑셀(xlsx) 파일 형식이 아닙니다.");
  const wb = X(wbXml);
  const rels = X((await get("xl/_rels/workbook.xml.rels")) || "<r/>");
  const rel: Record<string, string> = {};
  [...rels.getElementsByTagName("Relationship")].forEach((r) => (rel[r.getAttribute("Id") ?? ""] = r.getAttribute("Target") ?? ""));

  const out: Sheet[] = [];
  for (const sh of [...wb.getElementsByTagName("sheet")]) {
    const rid =
      sh.getAttribute("r:id") || [...sh.attributes].find((a) => /id$/i.test(a.name) && a.name !== "sheetId")?.value || "";
    let t = rel[rid] || "";
    t = t.startsWith("/") ? t.slice(1) : "xl/" + t.replace(/^\.\//, "");
    const xml = await get(t);
    if (!xml) continue;
    const rows: SheetCell[][] = [];
    for (const r of [...X(xml).getElementsByTagName("row")]) {
      const ri = Number(r.getAttribute("r")) - 1,
        row: SheetCell[] = [];
      for (const c of [...r.getElementsByTagName("c")]) {
        const ci = colIdx(c.getAttribute("r")),
          ty = c.getAttribute("t"),
          v = c.getElementsByTagName("v")[0];
        let val: SheetCell = "";
        if (ty === "s") val = ss[Number(v?.textContent)] ?? "";
        else if (ty === "inlineStr") val = tx(c);
        else if (ty === "str" || ty === "e") val = v?.textContent ?? "";
        else if (ty === "b") val = v?.textContent === "1";
        else if (v) val = Number(v.textContent);
        if (ci >= 0) row[ci] = val;
      }
      rows[ri >= 0 ? ri : rows.length] = Array.from(row, (x) => x ?? "");
    }
    out.push({ name: sh.getAttribute("name") ?? "", rows: Array.from(rows, (x) => x || []) });
  }
  return out;
}
