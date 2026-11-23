"use client";

import { useSyncExternalStore } from "react";

interface ToastItem {
  id: number;
  message: string;
  tone: "default" | "danger";
}

let items: ToastItem[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let seq = 0;

/** 화면 하단에 잠깐 뜨는 알림 (alert 대신) */
export function toast(message: string, tone: ToastItem["tone"] = "default") {
  const id = ++seq;
  items = [...items, { id, message, tone }];
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, 3200);
}

export function Toaster() {
  const list = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => items,
    () => items,
  );
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[9999] flex flex-col items-center gap-2 px-4">
      {list.map((t) => (
        <div
          key={t.id}
          role="status"
          className={
            "flex max-w-md animate-rise-in items-start gap-2.5 rounded-xl px-4 py-3 text-[13.5px] font-medium whitespace-pre-line text-white shadow-pop ring-1 ring-white/10 " +
            (t.tone === "danger" ? "bg-danger" : "bg-fg")
          }
        >
          <span
            aria-hidden
            className={"mt-[7px] size-1.5 flex-none rounded-full " + (t.tone === "danger" ? "bg-white" : "bg-brand-2")}
          />
          {t.message}
        </div>
      ))}
    </div>
  );
}
