"use client";

import type { MasterKind } from "@/constants/masters";
import { subscribe } from "@/lib/storage/store";
import { useMemo, useSyncExternalStore } from "react";
import { usedMasterSet } from "../lib";

const SEP = "\u0000";
const signature = (kind: MasterKind) => [...usedMasterSet(kind)].sort().join(SEP);

/** 기록에서 쓰고 있는 층·공종 값 (저장되면 자동 갱신) */
export function useUsedMasters(kind: MasterKind): Set<string> {
  const sig = useSyncExternalStore(
    subscribe,
    () => signature(kind),
    () => "",
  );
  return useMemo(() => new Set(sig ? sig.split(SEP) : []), [sig]);
}
