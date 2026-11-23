/**
 * 현장(site) 단위로 나뉜 localStorage 저장소.
 * - 같은 키를 여러 컴포넌트가 구독해도 JSON 파싱은 한 번만 합니다(캐시).
 * - 쓰기 후 구독자에게 알리고, 다른 탭의 변경(storage 이벤트)도 반영합니다.
 * - 원본과 같은 키 체계: 기본 현장은 `safety_<key>`, 추가 현장은 `safety_s_<id>_<key>`
 */
import { alertDialog } from "@/components/ui/confirm-dialog";
import type { CollectionKey } from "./keys";

export const SITE_CUR_KEY = "csm_currentSite";
export const DEFAULT_SITE_ID = "default";

export const sitePrefix = (id?: string | null) =>
  !id || id === DEFAULT_SITE_ID ? "safety_" : `safety_s_${id}_`;

const isBrowser = typeof window !== "undefined";

type Listener = () => void;
const listeners = new Set<Listener>();
const cache = new Map<string, unknown>();
let storageListenerAttached = false;

function emit() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener) {
  if (isBrowser && !storageListenerAttached) {
    storageListenerAttached = true;
    window.addEventListener("storage", (e) => {
      if (e.key) cache.delete(e.key);
      else cache.clear();
      emit();
    });
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ---------- 원시(raw) 키 접근: 현장 구분 없음 ----------

export function readRawKey<T>(fullKey: string, fallback: T): T {
  if (!isBrowser) return fallback;
  if (cache.has(fullKey)) return cache.get(fullKey) as T;
  let value: T = fallback;
  try {
    const raw = localStorage.getItem(fullKey);
    if (raw != null) value = JSON.parse(raw) as T;
  } catch {
    value = fallback;
  }
  cache.set(fullKey, value);
  return value;
}

export function writeRawKey(fullKey: string, value: unknown) {
  try {
    localStorage.setItem(fullKey, JSON.stringify(value));
  } catch (e) {
    void alertDialog({
      title: "저장하지 못했습니다",
      message: "브라우저 저장공간이 가득 찼습니다. 오래된 사진이나 기록을 정리해 주세요.",
    });
    throw e;
  }
  cache.set(fullKey, value);
  emit();
}

export function removeRawKey(fullKey: string) {
  localStorage.removeItem(fullKey);
  cache.delete(fullKey);
  emit();
}

/** 외부에서 localStorage를 직접 바꾼 뒤 캐시를 비우고 화면을 갱신 */
export function invalidateAll() {
  cache.clear();
  emit();
}

// ---------- 현재 현장 ----------

let currentSiteId: string | null = null;

export function getCurrentSiteId(): string {
  if (!isBrowser) return DEFAULT_SITE_ID;
  if (currentSiteId) return currentSiteId;
  let id = DEFAULT_SITE_ID;
  try {
    // DB 현장 목록에 있는지는 site-store 가 확인 (없으면 가장 마지막 현장으로 바꿈)
    id = localStorage.getItem(SITE_CUR_KEY) || DEFAULT_SITE_ID;
  } catch {
    id = DEFAULT_SITE_ID;
  }
  currentSiteId = id;
  return id;
}

/** 현장 전환: 이후 모든 read/write가 새 현장의 키를 사용 */
export function setCurrentSiteId(id: string) {
  currentSiteId = id;
  localStorage.setItem(SITE_CUR_KEY, id);
  emit();
}

export const siteKey = (key: CollectionKey, siteId = getCurrentSiteId()) => sitePrefix(siteId) + key;

// ---------- 현재 현장 기준 컬렉션 접근 ----------

const EMPTY: readonly never[] = Object.freeze([]);

export function read<T = unknown>(key: CollectionKey): T[] {
  const v = readRawKey<T[]>(siteKey(key), EMPTY as unknown as T[]);
  return Array.isArray(v) ? v : (EMPTY as unknown as T[]);
}

export function write<T>(key: CollectionKey, value: T[]) {
  writeRawKey(siteKey(key), value);
}
