"use client";

import { knownCompanies } from "@/lib/storage/masters";
import { subscribe } from "@/lib/storage/store";
import { useSyncExternalStore } from "react";

let cached: string[] = [];
let cachedKey = "";
function snapshot() {
  const list = knownCompanies();
  const key = list.join("\u0000");
  if (key !== cachedKey) {
    cachedKey = key;
    cached = list;
  }
  return cached;
}

/** 등록된 업체명 목록 (근로자·공정·하자·일정·출역에서 수집, 저장 시 자동 갱신) */
export function useCompanyNames(): string[] {
  return useSyncExternalStore(subscribe, snapshot, () => cached);
}

/** type=company 입력이 쓰는 업체명 자동완성 목록. 앱 셸에 한 번만 렌더링 */
export function CompanyDatalist() {
  const list = useCompanyNames();
  return (
    <datalist id="company-names">
      {list.map((c) => (
        <option key={c} value={c} />
      ))}
    </datalist>
  );
}
