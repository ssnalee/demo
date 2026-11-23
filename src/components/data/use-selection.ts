"use client";

import { useCallback, useMemo, useState } from "react";
import type { RowSelection } from "@/components/ui";

/** 표 행 선택 상태. 화면에 보이는 id만 선택 유지 */
export function useSelection(visibleIds: string[]): RowSelection & { clear: () => void; ids: string[] } {
  const [raw, setRaw] = useState<Set<string>>(() => new Set());
  const visible = useMemo(() => new Set(visibleIds), [visibleIds]);
  const selected = useMemo(() => new Set([...raw].filter((id) => visible.has(id))), [raw, visible]);

  const toggle = useCallback((id: string, on: boolean) => {
    setRaw((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const toggleAll = useCallback((on: boolean) => setRaw(on ? new Set(visibleIds) : new Set()), [visibleIds]);
  const clear = useCallback(() => setRaw(new Set()), []);

  const allChecked = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  return {
    selected,
    toggle,
    toggleAll,
    clear,
    allChecked,
    someChecked: selected.size > 0,
    ids: [...selected],
  };
}
