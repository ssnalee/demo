"use client";

import { Button, Modal, Notice, openPhoto, toast, confirmDelete } from "@/components/ui";
import { compressImage } from "@/lib/image";
import { FileDB } from "@/lib/storage/file-db";
import { read, write } from "@/lib/storage/store";
import { useEffect, useState } from "react";
import { WORKER_DOC_KINDS, workerDocKey, type Worker, type WorkerDocFile, type WorkerDocKind } from "../types";

type Slots = Partial<Record<WorkerDocKind, string>>;

function setWorkerDocFlag(id: string, kind: WorkerDocKind, on: boolean) {
  const list = read<Worker>("workers").map((w) => (w.id === id ? { ...w, docs: { ...(w.docs || {}), [kind]: on } } : w));
  write("workers", list);
}

/** 근로자 신분증·통장 사본 (IndexedDB 저장) */
export function WorkerDocsModal({ worker, onClose }: { worker: Worker | null; onClose: () => void }) {
  return (
    <Modal open={!!worker} onClose={onClose} title={worker ? `${worker.name} · 서류` : "서류"} size="lg">
      {worker && <DocSlots key={worker.id} workerId={worker.id} />}
    </Modal>
  );
}

function DocSlots({ workerId }: { workerId: string }) {
  const [slots, setSlots] = useState<Slots | null>(null);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState<WorkerDocKind | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all(
      WORKER_DOC_KINDS.map((k) =>
        FileDB.get<WorkerDocFile>(workerDocKey(workerId, k.key))
          .then((f) => [k.key, f?.data] as const)
          .catch(() => [k.key, undefined] as const),
      ),
    ).then((pairs) => {
      if (alive) setSlots(Object.fromEntries(pairs) as Slots);
    });
    return () => {
      alive = false;
    };
  }, [workerId, version]);

  const upload = async (kind: WorkerDocKind, file: File) => {
    setBusy(kind);
    try {
      const data = await compressImage(file, { max: 1600, quality: 0.72, limit: 900_000 });
      const value: WorkerDocFile = { data, name: file.name, at: new Date().toISOString() };
      await FileDB.put(workerDocKey(workerId, kind), value);
      setWorkerDocFlag(workerId, kind, true);
      setVersion((v) => v + 1);
    } catch (err) {
      toast((err as Error)?.message || "사진을 저장하지 못했습니다.", "danger");
    } finally {
      setBusy(null);
    }
  };

  const del = async (kind: WorkerDocKind) => {
    if (!(await confirmDelete("이 서류 사진을 삭제합니다."))) return;
    await FileDB.del(workerDocKey(workerId, kind)).catch(() => {});
    setWorkerDocFlag(workerId, kind, false);
    setVersion((v) => v + 1);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {WORKER_DOC_KINDS.map((k) => {
          const src = slots?.[k.key];
          return (
            <div key={k.key} className="rounded-xl bg-bg p-3">
              <div className="mb-2 text-[13px] font-semibold text-fg-2">{k.label}</div>
              <div className="mb-2.5 grid h-52 place-items-center overflow-hidden rounded-lg border border-line bg-white">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="서류 사진" onClick={() => openPhoto(src)} className="max-h-full max-w-full cursor-zoom-in object-contain" />
                ) : (
                  <span className="text-xs text-sub">{busy === k.key ? "처리 중…" : slots ? "사진 없음" : "불러오는 중…"}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-line bg-white px-[11px] py-1.5 text-[12.5px] font-medium hover:bg-fill">
                  사진 넣기
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) void upload(k.key, f);
                    }}
                  />
                </label>
                <Button size="sm" variant="danger" onClick={() => void del(k.key)}>
                  삭제
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <Notice>
        주민등록번호 뒷자리는 가리고 찍는 것을 권장합니다. 서류는 이 컴퓨터의 브라우저에만 저장됩니다.
      </Notice>
    </>
  );
}
