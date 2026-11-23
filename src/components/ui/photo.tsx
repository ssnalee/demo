"use client";

import { compressImage } from "@/lib/image";
import { useId, useState, useSyncExternalStore } from "react";
import { Button } from "./button";
import { Modal } from "./modal";
import { Label } from "./field";
import { toast } from "./toast";

// ---- 사진 크게 보기 (전역) ----
let viewerSrc: string | null = null;
const viewerListeners = new Set<() => void>();
export function openPhoto(src: string) {
  viewerSrc = src;
  viewerListeners.forEach((l) => l());
}
function closePhoto() {
  viewerSrc = null;
  viewerListeners.forEach((l) => l());
}
export function PhotoViewer() {
  const src = useSyncExternalStore(
    (l) => {
      viewerListeners.add(l);
      return () => viewerListeners.delete(l);
    },
    () => viewerSrc,
    () => null,
  );
  if (!src) return null;
  return (
    <Modal open onClose={closePhoto} size="lg" title="사진 보기">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="첨부사진" className="mx-auto max-h-[75vh] w-auto rounded-lg object-contain" />
    </Modal>
  );
}

/** 사진 첨부 입력: 자동 압축 후 dataURL을 onChange로 전달 */
export function PhotoInput({
  label,
  value,
  onChange,
  compress,
}: {
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  compress?: Parameters<typeof compressImage>[1];
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      <div className="mt-1.5 flex items-start gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label}
            onClick={() => openPhoto(value)}
            className="h-24 w-32 cursor-zoom-in rounded-[10px] border border-line bg-white object-cover"
          />
        ) : (
          <div className="grid h-24 w-32 place-items-center rounded-[10px] border border-dashed border-[#d0d5dd] text-xs text-sub">
            {busy ? "처리 중…" : "사진 없음"}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={id}
            className="inline-flex cursor-pointer items-center rounded-lg border border-line bg-white px-[11px] py-1.5 text-[12.5px] font-medium hover:bg-fill"
          >
            {value ? "다시 선택" : "사진 선택"}
          </label>
          <input
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              try {
                onChange(await compressImage(file, compress));
              } catch (err) {
                toast((err as Error).message, "danger");
              } finally {
                setBusy(false);
              }
            }}
          />
          {value && (
            <Button size="sm" variant="ghost" onClick={() => onChange("")}>
              삭제
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PhotoThumb({ src, alt = "사진" }: { src?: string; alt?: string }) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onClick={(e) => {
        e.stopPropagation();
        openPhoto(src);
      }}
      className="mt-2 mr-1 inline-block h-12 w-16 cursor-zoom-in rounded-lg object-cover"
    />
  );
}
