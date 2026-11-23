"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { CollectionKey } from "./keys";
import { getCurrentSiteId, read, readRawKey, subscribe, write, writeRawKey } from "./store";
import { nowISO } from "@/lib/date";

export interface Identified {
  id: string;
}

const EMPTY: never[] = [];

/** 현재 현장의 컬렉션을 구독 (저장되면 자동으로 다시 렌더링) */
export function useList<T>(key: CollectionKey): T[] {
  return useSyncExternalStore(
    subscribe,
    () => read<T>(key),
    () => EMPTY as T[],
  );
}

/**
 * CRUD 헬퍼가 붙은 컬렉션 훅.
 * 백엔드를 붙일 때는 이 훅의 내부만 API 호출로 바꾸면 됩니다.
 */
export function useCollection<T extends Identified>(key: CollectionKey) {
  const items = useList<T>(key);

  const get = useCallback((id: string) => read<T>(key).find((x) => String(x.id) === String(id)), [key]);

  /** id가 있으면 수정, 없으면 맨 앞에 추가. 수정이었으면 true */
  const upsert = useCallback(
    (item: T, opts: { append?: boolean } = {}) => {
      const list = read<T>(key).slice();
      const idx = list.findIndex((x) => String(x.id) === String(item.id));
      if (idx >= 0) list[idx] = item;
      else if (opts.append) list.push(item);
      else list.unshift(item);
      write(key, list);
      return idx >= 0;
    },
    [key],
  );

  /** 여러 건 한 번에 추가 (맨 앞) */
  const addMany = useCallback(
    (newItems: T[]) => {
      write(key, [...newItems, ...read<T>(key)]);
    },
    [key],
  );

  /** id 목록에 해당하는 항목을 patch 함수로 수정 */
  const updateMany = useCallback(
    (ids: Iterable<string>, patch: (item: T) => T) => {
      const set = new Set(ids);
      const now = nowISO();
      write(
        key,
        read<T>(key).map((x) => (set.has(x.id) ? { ...patch({ ...x }), updatedAt: now } : x)),
      );
    },
    [key],
  );

  const remove = useCallback(
    (ids: string | Iterable<string>) => {
      const set = new Set(typeof ids === "string" ? [ids] : ids);
      write(
        key,
        read<T>(key).filter((x) => !set.has(String(x.id))),
      );
    },
    [key],
  );

  const replaceAll = useCallback((list: T[]) => write(key, list), [key]);

  return useMemo(
    () => ({ items, get, upsert, addMany, updateMany, remove, replaceAll }),
    [items, get, upsert, addMany, updateMany, remove, replaceAll],
  );
}

/** 현재 현장 id (현장 전환 시 다시 렌더링) */
export function useSiteId(): string {
  return useSyncExternalStore(subscribe, getCurrentSiteId, () => "default");
}

/** 현장과 무관한 화면 설정 값 (원본의 ui_ 접두어 키) */
export function useUiPref<T>(name: string, fallback: T): [T, (v: T) => void] {
  const fullKey = "ui_" + name;
  const value = useSyncExternalStore(
    subscribe,
    () => readRawKey<T>(fullKey, fallback),
    () => fallback,
  );
  const set = useCallback((v: T) => writeRawKey(fullKey, v), [fullKey]);
  return [value ?? fallback, set];
}
