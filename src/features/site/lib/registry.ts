/** 현장별 로컬스토리지 원시 데이터 접근 (아직 DB 로 옮기기 전인 기능의 자료) */
import { DEFAULT_SITE_ID, invalidateAll, readRawKey, sitePrefix } from "@/lib/storage/store";

/** 다른 현장의 컬렉션 원시 값 (저장된 그대로) */
export function siteRead<T = unknown>(id: string, key: string): T[] {
  return readRawKey<T[]>(sitePrefix(id) + key, []);
}

/** 이 현장 키인지 (기본 현장 접두어 safety_ 는 추가 현장 safety_s_ 를 제외) */
function ownsKey(id: string, k: string) {
  return k.startsWith(sitePrefix(id)) && (id !== DEFAULT_SITE_ID || !k.startsWith("safety_s_"));
}

function storageKeys(): string[] {
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k != null) out.push(k);
  }
  return out;
}

/** 이 브라우저에서 현장 자료 키를 모두 지움 */
export function removeSiteData(id: string, opts: { silent?: boolean } = {}) {
  storageKeys()
    .filter((k) => ownsKey(id, k))
    .forEach((k) => localStorage.removeItem(k));
  if (!opts.silent) invalidateAll();
}

/** 파일 이름에 쓸 수 없는 문자 치환 */
export const safeFileName = (s: string) => s.replace(/[\\/:*?"<>|]/g, "_");
