"use client";

import { cn } from "@/lib/cn";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex animate-fade-in items-center justify-center bg-[rgba(16,24,40,.45)] p-4 backdrop-blur-[3px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "flex max-h-[90vh] w-full animate-pop-in flex-col overflow-hidden rounded-[20px] bg-white shadow-pop ring-1 ring-black/5",
          size === "sm" && "max-w-[420px]",
          size === "md" && "max-w-[520px]",
          size === "lg" && "max-w-[860px]",
          size === "full" && "h-[90vh] max-w-[min(1600px,97vw)]",
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 px-6 pt-6">
            <div>
              {title && <h3 className="text-[17px] font-bold tracking-[-0.025em]">{title}</h3>}
              {description && <p className="mt-1 text-[13px] text-sub">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="-mt-1 -mr-2 grid size-8 flex-none cursor-pointer place-items-center rounded-lg text-sub transition-colors hover:bg-fill hover:text-fg"
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line-2 bg-[#f9fafb] px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
