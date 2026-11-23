"use client";

import { useMemo, useSyncExternalStore } from "react";
import { DEFAULT_FLOORS, DEFAULT_TRADES, catalogOf, type MasterKind } from "@/constants/masters";
import { read, readRawKey, siteKey, subscribe, write } from "./store";

/** 저장된 값이 없으면 기본 목록, 사용자가 일부러 비운 경우(빈 배열)는 빈 목록 */
function useMasterList(key: "masterFloors" | "masterTrades", defaults: string[]): string[] {
  const stored = useSyncExternalStore(
    subscribe,
    () => readRawKey<string[] | null>(siteKey(key), null),
    () => null,
  );
  return Array.isArray(stored) ? stored : defaults;
}

/** 현장에서 사용하는 층·구역 / 공종 목록 (층별·공종 관리에서 편집) */
export function useMasters() {
  const floors = useMasterList("masterFloors", DEFAULT_FLOORS);
  const trades = useMasterList("masterTrades", DEFAULT_TRADES);
  return { floors, trades };
}

/** 컴포넌트 밖(이벤트 핸들러 등)에서 현재 목록 읽기 */
export function getMasters() {
  const f = readRawKey<string[] | null>(siteKey("masterFloors"), null);
  const t = readRawKey<string[] | null>(siteKey("masterTrades"), null);
  return { floors: Array.isArray(f) ? f : DEFAULT_FLOORS, trades: Array.isArray(t) ? t : DEFAULT_TRADES };
}

export interface OptionGroup {
  label: string;
  options: string[];
  /** 층·구역 묶음이면 "floor" (선택 상자에서 지하/지상 층수를 숫자로 입력) */
  kind?: MasterKind;
}

/** 카탈로그 그룹(지하층/지상 1~10층…, 가설공사/철거…) 기준으로 묶은 선택지 */
export function groupOptions(kind: MasterKind, values: string[]): OptionGroup[] {
  const set = new Set(values);
  const known = new Set<string>();
  const groups: OptionGroup[] = [];
  for (const [label, items] of catalogOf(kind)) {
    items.forEach((v) => known.add(v));
    const on = items.filter((v) => set.has(v));
    if (on.length) groups.push({ label, options: on, kind });
  }
  const rest = values.filter((v) => !known.has(v));
  if (rest.length) groups.push({ label: "직접 추가", options: rest, kind });
  return groups;
}

export function useGroupedMasters() {
  const { floors, trades } = useMasters();
  return useMemo(
    () => ({ floors, trades, floorGroups: groupOptions("floor", floors), tradeGroups: groupOptions("trade", trades) }),
    [floors, trades],
  );
}

/** 업체명 자동완성 후보 (근로자·공정·하자·일정·출역에서 수집) */
export function knownCompanies(): string[] {
  const set = new Set<string>();
  (["workers", "defects", "schedules", "attendance"] as const).forEach((k) =>
    read<{ company?: string }>(k).forEach((x) => {
      // 공정처럼 여러 업체를 "A, B"로 저장한 값도 나눠서 수집
      String(x?.company ?? "")
        .split(",")
        .forEach((c) => c.trim() && set.add(c.trim()));
    }),
  );
  return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b, "ko"));
}

// ---------- 업체 목록 (담당 업체 선택 · 업체 추가/삭제 팝업) ----------

/** 저장된 업체 목록. 아직 없으면 이미 입력된 업체명으로 시작 */
function readCompanyList(): string[] {
  const stored = readRawKey<string[] | null>(siteKey("masterCompanies"), null);
  return Array.isArray(stored) ? stored : knownCompanies();
}

let companyCache: string[] = [];
let companyKey = "";
function companySnapshot() {
  const list = readCompanyList();
  const key = list.join("\u0000");
  if (key !== companyKey) {
    companyKey = key;
    companyCache = list;
  }
  return companyCache;
}

/** 현장의 업체 목록 (저장되면 자동 갱신) */
export function useCompanyList(): string[] {
  return useSyncExternalStore(subscribe, companySnapshot, () => companyCache);
}

export function saveCompanyList(list: string[]) {
  write("masterCompanies", list);
}
