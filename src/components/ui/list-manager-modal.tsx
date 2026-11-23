"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./field";
import { Modal } from "./modal";
import { toast } from "./toast";

/**
 * 공통 목록 관리 팝업: 위에서 입력해 추가, 목록에서 ×로 삭제, 하단 저장/취소.
 * 업체·작업 단계 등 선택지 목록 편집에 사용.
 */
export function ListManagerModal(props: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  items: string[];
  onSave: (items: string[]) => void;
  placeholder?: string;
  emptyText?: string;
}) {
  // 열 때마다 저장된 목록에서 새로 시작
  return props.open ? <ListManagerDialog {...props} /> : null;
}

function ListManagerDialog({
  onClose,
  title,
  description,
  items,
  onSave,
  placeholder = "이름 입력",
  emptyText = "등록된 항목이 없습니다.",
}: {
  onClose: () => void;
  title: string;
  description?: string;
  items: string[];
  onSave: (items: string[]) => void;
  placeholder?: string;
  emptyText?: string;
}) {
  // 저장 전까지는 팝업 안에서만 바뀜
  const [list, setList] = useState(items);
  const [name, setName] = useState("");

  const add = () => {
    const v = name.trim();
    if (!v) return;
    if (list.includes(v)) return toast(`"${v}"은(는) 이미 있습니다.`, "danger");
    setList([...list, v]);
    setName("");
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button
            variant="primary"
            onClick={() => {
              onSave(list);
              onClose();
            }}
          >
            저장
          </Button>
        </>
      }
    >
      <div className="flex gap-2">
        <Input
          autoFocus
          placeholder={placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button className="flex-none" onClick={add}>
          추가
        </Button>
      </div>
      <ul className="mt-3 max-h-[320px] overflow-y-auto rounded-xl border border-line-2">
        {list.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-sub">{emptyText}</li>}
        {list.map((x) => (
          <li key={x} className="flex items-center gap-2 border-b border-line-2 px-4 py-2.5 text-[13.5px] last:border-b-0">
            <span className="min-w-0 flex-1 truncate">{x}</span>
            <button
              type="button"
              aria-label={`${x} 삭제`}
              onClick={() => setList(list.filter((y) => y !== x))}
              className="grid size-7 flex-none cursor-pointer place-items-center rounded-lg text-sub"
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
