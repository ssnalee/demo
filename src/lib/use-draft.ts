"use client";

import { useCallback, useState, type ChangeEvent } from "react";

type Changeable = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * 입력 폼 상태 헬퍼.
 *   const form = useDraft(emptyInspection);
 *   <Input {...form.bind("inspector")} />
 *   form.load(existing) / form.reset()
 */
export function useDraft<T extends object>(makeEmpty: () => T) {
  const [draft, setDraft] = useState<T>(makeEmpty);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => setDraft((d) => ({ ...d, [key]: value })), []);

  /** value + onChange 를 한 번에. 숫자 필드는 number로 변환 */
  const bind = <K extends keyof T>(key: K) => ({
    value: (draft[key] ?? "") as string | number,
    onChange: (e: ChangeEvent<Changeable>) => {
      const el = e.target;
      const v = el instanceof HTMLInputElement && el.type === "number" ? (el.value === "" ? "" : Number(el.value)) : el.value;
      set(key, v as T[K]);
    },
  });

  const bindCheck = <K extends keyof T>(key: K) => ({
    checked: !!draft[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => set(key, e.target.checked as T[K]),
  });

  const reset = useCallback((patch?: Partial<T>) => setDraft({ ...makeEmpty(), ...patch }), [makeEmpty]);
  const load = useCallback((value: T) => setDraft({ ...makeEmpty(), ...value }), [makeEmpty]);

  return { draft, set, setDraft, bind, bindCheck, reset, load };
}
