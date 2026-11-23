"use client";

import { listSites, type SiteDTO } from "@/server/actions/sites";
import { useEffect, useSyncExternalStore } from "react";
import { getCurrentSiteId, setCurrentSiteId, subscribe as subscribeStorage } from "./storage/store";

/**
 * 현장 목록 (DB) 공유 저장소. 앱 전체에서 한 번 불러와 같이 씀.
 * 지금 현장 id 는 로컬스토리지(store.ts)에 두고, DB 목록에 없으면 가장 마지막에 만든 현장으로 맞춤.
 */
interface State {
  /** undefined = 불러오는 중 */
  sites?: SiteDTO[];
  error?: string;
}

let state: State = {};
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** 지금 현장 id 가 목록에 없으면 가장 마지막(최근)에 만든 현장으로 */
function ensureCurrent() {
  const list = state.sites;
  if (!list?.length) return;
  if (!list.some((s) => s.id === getCurrentSiteId())) setCurrentSiteId(list[list.length - 1].id);
}

/** DB 에서 현장 목록 다시 불러오기 (만들기·수정·삭제 후 호출) */
export function reloadSites(): Promise<void> {
  loading = listSites()
    .then((r) => {
      state = r.ok ? { sites: r.sites } : { sites: state.sites ?? [], error: r.error };
      ensureCurrent();
    })
    .finally(() => {
      loading = null;
      emit();
    });
  return loading;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  const off = subscribeStorage(l); // 지금 현장 id 가 바뀌어도 다시 렌더링
  return () => {
    listeners.delete(l);
    off();
  };
};

/** 현장 목록 · 불러오기 오류 */
export function useSites(): State {
  const s = useSyncExternalStore(subscribe, () => state, () => state);
  useEffect(() => {
    if (state.sites === undefined && !loading) void reloadSites();
  }, []);
  return s;
}

/** 지금 현장 (불러오는 중이거나 현장이 없으면 undefined) */
export function getCurrentSite(): SiteDTO | undefined {
  return state.sites?.find((s) => s.id === getCurrentSiteId());
}

export function useCurrentSite(): SiteDTO | undefined {
  useSites();
  return useSyncExternalStore(subscribe, getCurrentSite, () => undefined);
}

/** 컴포넌트 밖에서 현장 목록 (불러오기 전이면 빈 배열) */
export const getSites = (): SiteDTO[] => state.sites ?? [];
