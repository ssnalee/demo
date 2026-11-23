"use client";

import { Button, Select } from "@/components/ui";
import { useState } from "react";
import { addFloorRange } from "../lib";

const B_OPTIONS = Array.from({ length: 7 }, (_, i) => ({ value: String(i), label: i ? `${i}층` : "없음" }));
const A_OPTIONS = Array.from({ length: 30 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}층` }));

/** 지하 n층 ~ 지상 m층 한 번에 켜기 */
export function FloorRangeBar() {
  const [b, setB] = useState("2");
  const [a, setA] = useState("7");
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-bg px-3.5 py-2.5 text-[13.5px]">
      지하
      <Select compact className="w-auto" options={B_OPTIONS} value={b} onChange={(e) => setB(e.target.value)} />
      부터 지상
      <Select compact className="w-auto" options={A_OPTIONS} value={a} onChange={(e) => setA(e.target.value)} />
      까지
      <Button size="sm" variant="primary" onClick={() => addFloorRange(Number(b) || 0, Number(a) || 0)}>
        한 번에 켜기
      </Button>
    </div>
  );
}
