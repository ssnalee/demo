import { alertDialog } from "@/components/ui/confirm-dialog";
import { getSiteInfo } from "@/lib/storage/site-info";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export { esc as escapeHtml };

const BASE_STYLE = `body{font-family:'Pretendard',Arial,'Malgun Gothic',sans-serif;padding:24px;color:#172334}h2{text-align:center}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:9px;text-align:left;vertical-align:top;white-space:pre-wrap}
th{background:#f1f4f7}.kv th{width:170px}.photos{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}
.photos figure{margin:0;max-width:48%;flex:1 1 200px}.photos img{width:100%;max-height:280px;object-fit:contain;border:1px solid #aaa}
.photos figcaption{text-align:center;font-size:12px;margin-top:4px}.sub{text-align:center;margin-top:-8px;color:#555}
@media print{button{display:none}}`;

/** 새 창에 HTML 문서를 열고 인쇄 대화상자를 띄움. body는 이미 escape된 HTML이어야 함 */
export function printHtml(title: string, bodyHtml: string, extraStyle = "") {
  const w = window.open("", "_blank");
  if (!w) {
    void alertDialog({ title: "팝업이 차단되었습니다", message: "브라우저에서 팝업을 허용해 주세요." });
    return;
  }
  w.document.write(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${BASE_STYLE}${extraStyle}</style></head><body>${bodyHtml}<script>setTimeout(()=>print(),300)</script></body></html>`,
  );
  w.document.close();
}

/** [항목, 값] 표 + 사진 형식의 기본 인쇄 양식 */
export function printRecord(title: string, rows: [string, unknown][], photos: [string, string | undefined][] = []) {
  const ph = photos
    .filter((p) => p[1])
    .map((p) => `<figure><img src="${p[1]}"><figcaption>${esc(p[0])}</figcaption></figure>`)
    .join("");
  printHtml(
    title,
    `<h2>${esc(title)}</h2><p class="sub">${esc(getSiteInfo().name)}</p>
<table class="kv">${rows.map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join("")}</table>
${ph ? `<div class="photos">${ph}</div>` : ""}`,
  );
}

/** 목록형 표 인쇄 */
export function printTable(title: string, heads: string[], rows: unknown[][], subtitle?: string) {
  printHtml(
    title,
    `<h2>${esc(title)}</h2><p class="sub">${esc(subtitle ?? getSiteInfo().name)}</p>
<table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`,
  );
}
