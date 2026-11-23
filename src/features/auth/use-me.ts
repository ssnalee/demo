"use client";

import { getMe } from "@/server/actions/auth";
import type { CurrentUser } from "@/server/auth";
import { useEffect, useSyncExternalStore } from "react";

/** 로그인한 내 정보 (이름·관리자 여부). 앱 전체에서 한 번만 불러와 공유 */
let me: CurrentUser | null | undefined;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load() {
  loading ??= getMe()
    .then((u) => {
      me = u;
    })
    .catch(() => {
      me = null;
    })
    .finally(() => listeners.forEach((l) => l()));
  return loading;
}

/** undefined = 불러오는 중, null = 로그인 안 됨 */
export function useMe(): CurrentUser | null | undefined {
  const value = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => me,
    () => undefined,
  );
  useEffect(() => {
    if (me === undefined) void load();
  }, []);
  return value;
}
