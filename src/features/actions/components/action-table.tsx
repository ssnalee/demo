"use client";

import { Badge, Button, DataTable, Muted, Panel, PhotoThumb, RowActions, Select, Tag, toast, type Column, confirmDelete, confirmDialog } from "@/components/ui";
import { compressImage } from "@/lib/image";
import { nowISO } from "@/lib/date";
import { printRecord } from "@/lib/print";
import { useCollection } from "@/lib/storage/hooks";
import { read, write } from "@/lib/storage/store";
import { useState } from "react";
import { ACTION_STATUSES, type Action } from "../types";

function patchAction(id: string, patch: (x: Action) => Action) {
  const a = read<Action>("actions");
  const idx = a.findIndex((v) => String(v.id) === String(id));
  if (idx < 0) return false;
  const next = a.slice();
  next[idx] = patch({ ...a[idx] });
  write("actions", next);
  return true;
}

async function setAction(id: string, status: string) {
  if (status === "확인완료" && !(await confirmDialog({ title: "확인완료로 바꿀까요?", message: "현장 조치와 증빙을 실제로 확인했습니까?", confirmText: "확인완료" }))) return;
  patchAction(id, (x) => ({ ...x, status }));
}

async function verifyAction(id: string) {
  const verifier = prompt("현장 조치를 확인한 담당자 성명을 입력해 주세요.");
  if (!verifier) return;
  const x = read<Action>("actions").find((v) => v.id === id);
  if (!x) return;
  if (!x.evidence && !(await confirmDialog({ title: "증빙사진이 없습니다", message: "현장을 직접 확인했습니까?", confirmText: "확인했습니다" }))) return;
  patchAction(id, (v) => ({ ...v, verifier, status: "확인완료", verifiedAt: nowISO() }));
}

async function attachEvidence(id: string, file: File) {
  try {
    const data = await compressImage(file);
    if (patchAction(id, (x) => ({ ...x, evidence: data, evidenceName: file.name }))) toast("개선조치 증빙사진을 저장했습니다.");
  } catch (err) {
    toast((err as Error).message, "danger");
  }
}

async function deleteAction(id: string) {
  const a = read<Action>("actions");
  if (!a.some((x) => String(x.id) === String(id))) return toast("삭제할 개선조치 기록을 찾지 못했습니다.", "danger");
  if (!(await confirmDelete("이 개선조치 기록만 삭제합니다.\n연결된 위험성평가 기록은 유지됩니다."))) return;
  write(
    "actions",
    a.filter((x) => String(x.id) !== String(id)),
  );
  toast("개선조치 기록을 삭제했습니다.");
}

function printAction(x: Action) {
  printRecord(
    "개선조치 기록",
    [
      ["층·구역", x.floor],
      ["위험요인·개선조치", x.title],
      ["개선대책", x.control],
      ["담당자", x.owner],
      ["조치기한", x.due],
      ["상태", x.status],
      ["확인자", x.verifier],
      ["우선순위", x.priority],
    ],
    [["조치 증빙사진", x.evidence]],
  );
}

const priorityTone = (p?: string) => (p === "긴급" ? "danger" : p === "높음" ? "warning" : "neutral");

export function ActionTable({ onEdit }: { onEdit: (x: Action) => void }) {
  const { items } = useCollection<Action>("actions");
  const [filter, setFilter] = useState("");
  const rows = items.filter((x) => !filter || x.status === filter);

  const columns: Column<Action>[] = [
    {
      key: "title",
      header: "위험요인·개선대책",
      cell: (x) => (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            {x.floor}
            {x.priority && (
              <Badge tone={priorityTone(x.priority)} dot={false}>
                {x.priority}
              </Badge>
            )}
          </div>
          <b>{x.title}</b>
          {x.control && <Muted className="whitespace-pre-wrap">{x.control}</Muted>}
          {x.evidence && (
            <div>
              <Muted>조치 증빙사진 등록됨</Muted>
              <PhotoThumb src={x.evidence} alt="조치 증빙사진" />
            </div>
          )}
        </>
      ),
    },
    {
      key: "owner",
      header: "담당자·기한·확인자",
      cell: (x) => (
        <>
          {x.owner || "미지정"}
          <br />
          {x.due || "기한 미정"}
          <Muted>확인자: {x.verifier || "미확인"}</Muted>
        </>
      ),
    },
    {
      key: "status",
      header: "상태",
      cell: (x) => (
        <Badge tone={x.status === "확인완료" ? "success" : x.status === "완료요청" ? "info" : x.status === "조치중" ? "warning" : "neutral"}>
          {x.status}
        </Badge>
      ),
    },
    {
      key: "manage",
      header: "증빙·처리",
      cell: (x) => (
        <div className="flex min-w-[190px] flex-col gap-1.5">
          <label className="no-print inline-flex w-fit cursor-pointer items-center rounded-lg border border-line bg-white px-[11px] py-1.5 text-[12.5px] font-medium hover:bg-fill">
            {x.evidence ? "증빙사진 변경" : "증빙사진 첨부"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void attachEvidence(x.id, f);
              }}
            />
          </label>
          {x.status !== "확인완료" && (
            <div className="no-print flex flex-wrap gap-1">
              <Button size="sm" onClick={() => setAction(x.id, "조치중")}>
                조치중
              </Button>
              <Button size="sm" onClick={() => setAction(x.id, "완료요청")}>
                완료요청
              </Button>
              <Button size="sm" variant="primary" onClick={() => verifyAction(x.id)}>
                확인완료
              </Button>
            </div>
          )}
          <RowActions onEdit={() => onEdit(x)} onPrint={() => printAction(x)} onDelete={() => deleteAction(x.id)} />
        </div>
      ),
    },
  ];

  return (
    <Panel
      title="개선조치 목록"
      className="mt-3"
      actions={
        <Select
          compact
          className="w-auto min-w-[140px]"
          placeholder="전체 상태"
          options={[...ACTION_STATUSES]}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      }
    >
      <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
        <Tag>전체 {items.length}건</Tag>
        <Tag>미완료 {items.filter((x) => x.status !== "확인완료").length}건</Tag>
      </div>
      <DataTable rows={rows} columns={columns} />
    </Panel>
  );
}
