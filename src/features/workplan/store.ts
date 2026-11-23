"use client";

import { useSiteId } from "@/lib/storage/hooks";
import { listWorkplans } from "@/server/actions/workplans";
import { useEffect, useSyncExternalStore } from "react";
import type { Workplan } from "./types";

/**
 * 지금 현장의 작업계획서 (DB). 작업계획서·작업일보 화면이 함께 씀.
 * 현장이 바뀌면 다시 불러오고, 저장·삭제 후에는 reloadWorkplans() 호출.
 */
interface State {
  siteId?: string;
  /** undefined = 불러오는 중 */
  items?: Workplan[];
  error?: string;
}

let state: State = {};
let loadingFor: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function reloadWorkplans(siteId = state.siteId): Promise<void> {
  if (!siteId) return Promise.resolve();
  loadingFor = siteId;
  if (state.siteId !== siteId) {
    state = { siteId };
    emit();
  }
  return listWorkplans(siteId).then((r) => {
    if (loadingFor !== siteId) return;
    loadingFor = null;
    state = r.ok ? { siteId, items: r.items } : { siteId, items: state.items ?? [], error: r.error };
    emit();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** 지금 현장의 작업계획서. items 가 undefined 면 불러오는 중 */
export function useWorkplans(): { items: Workplan[] | undefined; error?: string; siteId: string } {
  const siteId = useSiteId();
  const s = useSyncExternalStore(subscribe, () => state, () => state);
  useEffect(() => {
    if ((state.siteId !== siteId || state.items === undefined) && loadingFor !== siteId) void reloadWorkplans(siteId);
  }, [siteId]);
  const mine = s.siteId === siteId;
  return { items: mine ? s.items : undefined, error: mine ? s.error : undefined, siteId };
}

/** 컴포넌트 밖에서 (불러오기 전이면 빈 배열) */
export const getWorkplans = (): Workplan[] => state.items ?? [];
