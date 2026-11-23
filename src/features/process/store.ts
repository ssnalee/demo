"use client";

import { useSiteId } from "@/lib/storage/hooks";
import { listProcesses } from "@/server/actions/processes";
import { useEffect, useSyncExternalStore } from "react";
import type { Process } from "./types";

/**
 * 지금 현장의 공정 목록 (DB). 공정표·대시보드 등이 함께 씀.
 * 현장이 바뀌면 다시 불러오고, 저장·삭제 후에는 reloadProcesses() 호출.
 */
interface State {
  siteId?: string;
  /** undefined = 불러오는 중 */
  items?: Process[];
  error?: string;
}

let state: State = {};
let loadingFor: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function reloadProcesses(siteId = state.siteId): Promise<void> {
  if (!siteId) return Promise.resolve();
  loadingFor = siteId;
  if (state.siteId !== siteId) {
    state = { siteId };
    emit();
  }
  return listProcesses(siteId).then((r) => {
    if (loadingFor !== siteId) return; // 그사이 현장이 바뀜
    loadingFor = null;
    state = r.ok ? { siteId, items: r.items } : { siteId, items: state.items ?? [], error: r.error };
    emit();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** 지금 현장의 공정. items 가 undefined 면 불러오는 중 */
export function useProcesses(): { items: Process[] | undefined; error?: string; siteId: string } {
  const siteId = useSiteId();
  const s = useSyncExternalStore(subscribe, () => state, () => state);
  useEffect(() => {
    if ((state.siteId !== siteId || state.items === undefined) && loadingFor !== siteId) void reloadProcesses(siteId);
  }, [siteId]);
  const mine = s.siteId === siteId;
  return { items: mine ? s.items : undefined, error: mine ? s.error : undefined, siteId };
}
