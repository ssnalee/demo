/** 근로자 서류 파일(IndexedDB)과 다른 현장 확인 */
import { FileDB } from "@/lib/storage/file-db";
import { getSites } from "@/lib/site-store";
import { getCurrentSiteId, readRawKey, sitePrefix } from "@/lib/storage/store";
import { WORKER_DOC_KINDS, workerDocKey, type Worker } from "./types";

/** 다른 현장에도 같은 id의 근로자가 있는지 (있으면 서류 파일을 지우지 않음) */
export function workerInOtherSite(workerId: string): boolean {
  const cur = getCurrentSiteId();
  const ids = getSites().map((s) => s.id);
  return ids.some((id) => {
    if (id === cur) return false;
    const list = readRawKey<Worker[]>(sitePrefix(id) + "workers", []);
    return Array.isArray(list) && list.some((w) => w.id === workerId);
  });
}

/** 근로자 삭제 후 서류 파일 정리 */
export function deleteWorkerFiles(ids: string[]) {
  ids.forEach((id) => {
    if (workerInOtherSite(id)) return;
    WORKER_DOC_KINDS.forEach((k) => FileDB.del(workerDocKey(id, k.key)).catch(() => {}));
  });
}
