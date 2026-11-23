import { confirmDialog } from "@/components/ui";
import { catalogOf, type MasterKind } from "@/constants/masters";
import { getMasters } from "@/lib/storage/masters";
import { read, write } from "@/lib/storage/store";
import { MASTER_USE_KEYS, type MasterRecord } from "./types";

const storageKey = (kind: MasterKind) => (kind === "floor" ? "masterFloors" : "masterTrades");
const currentList = (kind: MasterKind) => {
  const m = getMasters();
  return kind === "floor" ? m.floors : m.trades;
};

/** 층·공종 목록 저장 → useMasters() 구독자 자동 갱신 */
export function saveMaster(kind: MasterKind, arr: string[]) {
  write<string>(storageKey(kind), arr);
}

/** 카탈로그 순서로 정렬 (카탈로그에 없는 항목은 원래 순서대로 뒤에) */
export function sortByCatalog(kind: MasterKind, arr: string[]): string[] {
  const order = catalogOf(kind).flatMap((g) => g[1]);
  return arr
    .map((v, i) => [v, i] as const)
    .sort((x, y) => {
      const a = order.indexOf(x[0]);
      const b = order.indexOf(y[0]);
      return (a < 0 ? 9999 + x[1] : a) - (b < 0 ? 9999 + y[1] : b);
    })
    .map((x) => x[0]);
}

/** 해당 값을 쓰는 기록 수 */
export function masterUseCount(kind: MasterKind, value: string): number {
  return MASTER_USE_KEYS.reduce((n, k) => n + read<MasterRecord>(k).filter((x) => x && x[kind] === value).length, 0);
}

/** 기록에서 쓰고 있는 값 목록 */
export function usedMasterSet(kind: MasterKind): Set<string> {
  const set = new Set<string>();
  MASTER_USE_KEYS.forEach((k) =>
    read<MasterRecord>(k).forEach((x) => {
      if (x && x[kind]) set.add(String(x[kind]));
    }),
  );
  return set;
}

/** 여러 값을 한꺼번에 켜기/끄기. 사용 중인 항목을 끌 때는 확인 */
export async function setMasterValues(kind: MasterKind, values: string[], on: boolean) {
  const arr = currentList(kind);
  if (on) {
    const next = sortByCatalog(kind, [...new Set([...arr, ...values])]);
    if (next.length !== arr.length) saveMaster(kind, next);
    return;
  }
  const remove = new Set(values.filter((v) => arr.includes(v)));
  if (!remove.size) return;
  const usedSet = usedMasterSet(kind);
  const used = [...remove].filter((v) => usedSet.has(v));
  if (
    used.length &&
    !(await confirmDialog({
      title: `사용 중인 항목 ${used.length}개도 함께 빠집니다`,
      message: `${used.slice(0, 5).join(", ")}${used.length > 5 ? " 등" : ""}\n기존 기록 내용은 그대로 남습니다.`,
      confirmText: "빼기",
      danger: true,
    }))
  )
    return;
  saveMaster(
    kind,
    arr.filter((v) => !remove.has(v)),
  );
}

export function setAllMaster(kind: MasterKind, on: boolean) {
  const all = on ? catalogOf(kind).flatMap((g) => g[1]) : currentList(kind).slice();
  return setMasterValues(kind, all, on);
}

/** 목록에서 빼기 확인 (사용 중이면 건수 안내) */
const confirmRemove = (value: string, n: number) =>
  confirmDialog({
    title: `"${value}"을(를) 목록에서 뺄까요?`,
    message: n ? `기록 ${n}건에서 쓰고 있습니다.\n목록에서 빼도 기존 기록은 그대로 남습니다.` : undefined,
    confirmText: "빼기",
    danger: true,
  });

export async function toggleMaster(kind: MasterKind, value: string) {
  const arr = currentList(kind);
  if (arr.includes(value)) {
    const n = masterUseCount(kind, value);
    if (n && !(await confirmRemove(value, n))) return;
    saveMaster(
      kind,
      arr.filter((x) => x !== value),
    );
  } else saveMaster(kind, sortByCatalog(kind, [...arr, value]));
}

/** 지하 b층 ~ 지상 a층 한 번에 켜기 */
export function addFloorRange(basement: number, above: number) {
  const add: string[] = [];
  for (let i = basement; i >= 1; i--) add.push(`지하 ${i}층`);
  for (let i = 1; i <= above; i++) add.push(`${i}층`);
  saveMaster("floor", sortByCatalog("floor", [...new Set([...currentList("floor"), ...add])]));
}

/** 직접 추가. 오류 메시지를 반환하면 실패 */
export function addMasterItem(kind: MasterKind, raw: string): string | void {
  const value = raw.trim();
  const arr = currentList(kind);
  if (!value) return "등록할 이름을 입력해 주세요.";
  if (arr.includes(value)) return "이미 등록된 항목입니다.";
  saveMaster(kind, [...arr, value]);
}

/** 이름 바꾸기: 기존 기록의 층·공종 이름도 함께 변경 */
export function renameMasterItem(kind: MasterKind, index: number, raw: string): string | void {
  const arr = currentList(kind);
  const old = arr[index];
  if (old === undefined) return;
  const next = raw.trim();
  if (!next) return "빈 이름은 저장할 수 없습니다.";
  if (next === old) return;
  if (arr.includes(next)) return "이미 등록된 항목입니다.";
  MASTER_USE_KEYS.forEach((k) => {
    let changed = false;
    const list = read<MasterRecord>(k).map((x) => {
      if (x && x[kind] === old) {
        changed = true;
        return { ...x, [kind]: next };
      }
      return x;
    });
    if (changed) write(k, list);
  });
  const updated = arr.slice();
  updated[index] = next;
  saveMaster(kind, updated);
}

export async function deleteMasterItem(kind: MasterKind, index: number) {
  const arr = currentList(kind);
  const value = arr[index];
  if (value === undefined) return;
  const n = masterUseCount(kind, value);
  if (!(await confirmRemove(value, n))) return;
  saveMaster(
    kind,
    arr.filter((_, i) => i !== index),
  );
}
