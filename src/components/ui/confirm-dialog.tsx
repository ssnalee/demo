"use client";

import { cn } from "@/lib/cn";
import { useSyncExternalStore, type ReactNode } from "react";
import { Button } from "./button";
import { Icon, type IconName } from "./icon";
import { Modal } from "./modal";

/**
 * 공통 확인·알림 팝업 (브라우저 confirm/alert 대신).
 *   if (!(await confirmDialog({ title: "삭제할까요?", danger: true }))) return;
 *   await alertDialog({ title: "삭제할 수 없습니다", message: "..." });
 * 앱 셸에 <DialogHost /> 를 한 번만 렌더링.
 */
export interface DialogOptions {
  title: ReactNode;
  message?: ReactNode;
  /** 확인 버튼 문구 (기본 "확인") */
  confirmText?: string;
  /** 취소 버튼 문구 (기본 "취소") */
  cancelText?: string;
  /** 삭제처럼 되돌릴 수 없는 동작: 빨간 버튼 + 경고 아이콘 */
  danger?: boolean;
  icon?: IconName;
}

interface DialogState extends DialogOptions {
  kind: "confirm" | "alert";
  resolve: (ok: boolean) => void;
}

let current: DialogState | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function open(kind: DialogState["kind"], opts: DialogOptions): Promise<boolean> {
  // 이미 떠 있는 팝업은 취소로 닫고 새로 띄움
  current?.resolve(false);
  return new Promise((resolve) => {
    current = { ...opts, kind, resolve };
    emit();
  });
}

export const confirmDialog = (opts: DialogOptions) => open("confirm", opts);
export const alertDialog = (opts: DialogOptions) => open("alert", opts).then(() => undefined);

/** 삭제 확인 (문구만 넘기면 됨) */
export const confirmDelete = (message: ReactNode, title: ReactNode = "삭제할까요?") =>
  confirmDialog({ title, message, confirmText: "삭제", danger: true });

function close(ok: boolean) {
  const d = current;
  current = null;
  emit();
  d?.resolve(ok);
}

export function DialogHost() {
  const d = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );
  if (!d) return null;
  const icon: IconName = d.icon ?? (d.danger ? "alert" : d.kind === "alert" ? "alertCircle" : "check");

  return (
    <Modal
      open
      onClose={() => close(false)}
      size="sm"
      className="max-w-[400px]"
      footer={
        <>
          {d.kind === "confirm" && <Button onClick={() => close(false)}>{d.cancelText ?? "취소"}</Button>}
          <Button
            variant={d.danger ? "danger" : "primary"}
            className={cn(d.danger && "border-danger bg-danger text-white")}
            autoFocus
            onClick={() => close(true)}
          >
            {d.confirmText ?? "확인"}
          </Button>
        </>
      }
    >
      <div className="flex gap-3.5 pt-2">
        <span
          className={cn(
            "grid size-10 flex-none place-items-center rounded-full",
            d.danger ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand",
          )}
        >
          <Icon name={icon} size={20} />
        </span>
        <div className="min-w-0 pt-1">
          <h3 className="text-[16px] font-bold tracking-[-0.02em] text-fg">{d.title}</h3>
          {d.message && <div className="mt-1.5 text-[13.5px] leading-relaxed whitespace-pre-line text-sub">{d.message}</div>}
        </div>
      </div>
    </Modal>
  );
}
