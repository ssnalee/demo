"use client";

import { Button, Input, toast } from "@/components/ui";
import type { MasterKind } from "@/constants/masters";
import { useState } from "react";
import { addMasterItem, deleteMasterItem, renameMasterItem } from "../lib";
import { masterLabel } from "../types";

/** 목록에 없는 항목 직접 추가 · 이름 바꾸기 · 빼기 */
export function MasterManual({ floors, trades }: { floors: string[]; trades: string[] }) {
  return (
    <details className="group mt-4 border-t border-line-2 pt-3.5">
      <summary className="cursor-pointer text-[13px] font-semibold text-sub">목록에 없는 항목 직접 추가 · 이름 바꾸기</summary>
      <div className="mt-3.5 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <MasterList kind="floor" values={floors} placeholder="예: 옥탑 기계실" />
        <MasterList kind="trade" values={trades} placeholder="예: 외벽 보수공사" />
      </div>
    </details>
  );
}

function MasterList({ kind, values, placeholder }: { kind: MasterKind; values: string[]; placeholder: string }) {
  const [input, setInput] = useState("");
  const add = () => {
    const err = addMasterItem(kind, input);
    if (err) return toast(err, "danger");
    setInput("");
    toast(`${masterLabel(kind)} 항목을 추가했습니다.`);
  };
  const rename = (i: number) => {
    const v = prompt("새 이름을 입력해 주세요.", values[i]);
    if (v === null) return;
    const err = renameMasterItem(kind, i, v);
    if (err) toast(err, "danger");
  };
  return (
    <div className="min-w-0">
      <h4 className="mb-2 text-sm font-semibold">{masterLabel(kind)}</h4>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Input value={input} placeholder={placeholder} onChange={(e) => setInput(e.target.value)} />
        <Button type="submit" variant="primary">
          추가
        </Button>
      </form>
      <div className="mt-2">
        {values.map((x, i) => (
          <div key={x} className="flex items-center justify-between gap-2 border-b border-line-2 py-1.5 text-[13.5px]">
            <span className="min-w-0 break-all">{x}</span>
            <span className="flex flex-none gap-1">
              <Button size="sm" onClick={() => rename(i)}>
                수정
              </Button>
              <Button size="sm" variant="danger" onClick={() => deleteMasterItem(kind, i)}>
                삭제
              </Button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
