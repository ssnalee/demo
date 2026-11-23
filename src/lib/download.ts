function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type Cell = string | number | boolean | null | undefined;

/** 엑셀에서 한글이 깨지지 않도록 BOM 포함 CSV */
export function downloadCSV(rows: Cell[][], filename: string) {
  const csv =
    "﻿" +
    rows.map((r) => r.map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(",")).join("\r\n");
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export function downloadJSON(data: unknown, filename: string) {
  triggerDownload(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), filename);
}
