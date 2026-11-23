"use server";

import { AuthError, requireSiteMember } from "../auth";
import type { TablesInsert, TablesUpdate, WorkplanStatus, WorkplanType } from "../database.types";
import { db } from "../supabase";

/** 화면용 작업계획서 (DTO). 시간은 "HH:MM" */
export interface WorkplanDTO {
  id: string;
  date: string;
  type: WorkplanType;
  floor: string;
  trade: string;
  title: string;
  location: string;
  leader: string;
  workers: number;
  start: string;
  end: string;
  equipment: string;
  materials: string;
  scope: string;
  sequence: string;
  hazards: string;
  safety: string;
  emergency: string;
  status: WorkplanStatus;
  reviewer: string;
  updatedAt: string;
}

/** 저장 입력값 (id 가 있으면 수정) */
export type WorkplanInput = Partial<Omit<WorkplanDTO, "updatedAt">> & Pick<WorkplanDTO, "date" | "floor" | "trade" | "title">;

/** 일괄 변경: 날짜 옮기기(일) 또는 한 칸 값 지정 */
export type WorkplanBulkChange =
  | { kind: "shift"; days: number }
  | { kind: "set"; field: "status" | "date" | "leader" | "workers" | "reviewer"; value: string | number };

export type WorkplanResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const TYPES: WorkplanType[] = ["일일 작업", "주간 작업", "공정 변경 작업", "긴급·수시 작업"];
const STATUSES: WorkplanStatus[] = ["작성중", "검토요청", "승인", "작업완료", "보류"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const MAX_BULK = 500;

const text = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");
const addDays = (d: string, n: number) => new Date(Date.parse(d + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);

async function guard<T extends object>(fn: () => Promise<WorkplanResult<T>>, fallback: string): Promise<WorkplanResult<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: fallback };
  }
}

/** 입력값 검사 → DB 칸 (DB 제약과 같은 규칙) */
function toRow(input: WorkplanInput): { error: string } | { row: Omit<TablesInsert<"workplans">, "site_id"> } {
  const title = text(input.title);
  const floor = text(input.floor);
  const trade = text(input.trade);
  if (!DATE_RE.test(String(input.date ?? ""))) return { error: "작업일자를 입력해 주세요." };
  if (!floor || !trade) return { error: "층·구역과 공종을 선택해 주세요." };
  if (!title) return { error: "작업명을 입력해 주세요." };
  const type = (input.type ?? "일일 작업") as WorkplanType;
  const status = (input.status ?? "작성중") as WorkplanStatus;
  if (!TYPES.includes(type)) return { error: "작업 구분 값이 올바르지 않습니다." };
  if (!STATUSES.includes(status)) return { error: "계획 상태 값이 올바르지 않습니다." };
  const workers = Math.round(Number(input.workers) || 0);
  if (workers < 0 || workers > 999) return { error: "예정 인원은 0~999명으로 입력해 주세요." };
  const start = text(input.start);
  const end = text(input.end);
  if ((start && !TIME_RE.test(start)) || (end && !TIME_RE.test(end))) return { error: "시간 형식이 올바르지 않습니다." };
  if (start && end && end <= start) return { error: "작업 종료 예정시간은 시작 예정시간 이후여야 합니다." };
  return {
    row: {
      work_date: String(input.date),
      work_type: type,
      floor,
      trade,
      title,
      location: text(input.location),
      leader_name: text(input.leader),
      worker_count: workers,
      start_time: start,
      end_time: end,
      equipment: text(input.equipment),
      materials: text(input.materials),
      scope: text(input.scope),
      sequence: text(input.sequence),
      hazards: text(input.hazards),
      safety_measures: text(input.safety),
      emergency: text(input.emergency),
      status,
      reviewer_name: text(input.reviewer),
    },
  };
}

/** 현장 작업계획서 목록 (작업일 최근 순) */
export async function listWorkplans(siteId: string): Promise<WorkplanResult<{ items: WorkplanDTO[] }>> {
  return guard<{ items: WorkplanDTO[] }>(async () => {
    await requireSiteMember(siteId);
    const { data, error } = await db()
      .from("workplans")
      .select("*")
      .eq("site_id", siteId)
      .order("work_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return {
      ok: true,
      items: data.map((w) => ({
        id: w.id,
        date: w.work_date,
        type: w.work_type,
        floor: w.floor,
        trade: w.trade,
        title: w.title,
        location: w.location ?? "",
        leader: w.leader_name ?? "",
        workers: w.worker_count,
        start: hhmm(w.start_time),
        end: hhmm(w.end_time),
        equipment: w.equipment ?? "",
        materials: w.materials ?? "",
        scope: w.scope ?? "",
        sequence: w.sequence ?? "",
        hazards: w.hazards ?? "",
        safety: w.safety_measures ?? "",
        emergency: w.emergency ?? "",
        status: w.status,
        reviewer: w.reviewer_name ?? "",
        updatedAt: w.updated_at,
      })),
    };
  }, "작업계획서 목록을 불러오지 못했습니다.");
}

/** 한 건 등록·수정 */
export async function saveWorkplan(siteId: string, input: WorkplanInput): Promise<WorkplanResult<{ id: string; updated: boolean }>> {
  return guard<{ id: string; updated: boolean }>(async () => {
    const me = await requireSiteMember(siteId);
    const r = toRow(input);
    if ("error" in r) return { ok: false, error: r.error };
    if (input.id) {
      const { data, error } = await db()
        .from("workplans")
        .update({ ...r.row, updated_by: me.id })
        .eq("id", input.id)
        .eq("site_id", siteId)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) return { ok: false, error: "수정할 작업계획서를 찾지 못했습니다." };
      return { ok: true, id: data.id, updated: true };
    }
    const { data, error } = await db()
      .from("workplans")
      .insert({ ...r.row, site_id: siteId, created_by: me.id, updated_by: me.id })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: data.id, updated: false };
  }, "작업계획서를 저장하지 못했습니다.");
}

/** 여러 건 한 번에 등록 (하나라도 잘못되면 전부 저장 안 함) */
export async function createWorkplans(siteId: string, inputs: WorkplanInput[]): Promise<WorkplanResult<{ count: number }>> {
  return guard<{ count: number }>(async () => {
    const me = await requireSiteMember(siteId);
    if (!inputs.length) return { ok: false, error: "저장할 줄이 없습니다." };
    if (inputs.length > MAX_BULK) return { ok: false, error: `한 번에 ${MAX_BULK}건까지 등록할 수 있습니다.` };
    const rows: TablesInsert<"workplans">[] = [];
    for (const [i, input] of inputs.entries()) {
      const r = toRow(input);
      if ("error" in r) return { ok: false, error: `${i + 1}번째 줄: ${r.error}` };
      rows.push({ ...r.row, site_id: siteId, created_by: me.id, updated_by: me.id });
    }
    const { error } = await db().from("workplans").insert(rows);
    if (error) throw error;
    return { ok: true, count: rows.length };
  }, "작업계획서를 저장하지 못했습니다.");
}

/** 선택한 작업계획서 일괄 변경 */
export async function bulkUpdateWorkplans(siteId: string, ids: string[], change: WorkplanBulkChange): Promise<WorkplanResult> {
  return guard(async () => {
    const me = await requireSiteMember(siteId);
    if (!ids.length) return { ok: true };
    if (change.kind === "shift") {
      const days = Math.round(Number(change.days) || 0);
      if (!days) return { ok: false, error: "옮길 일수를 입력해 주세요." };
      const { data, error } = await db().from("workplans").select("id, work_date").eq("site_id", siteId).in("id", ids);
      if (error) throw error;
      for (const w of data) {
        const { error: e } = await db()
          .from("workplans")
          .update({ work_date: addDays(w.work_date, days), updated_by: me.id })
          .eq("id", w.id)
          .eq("site_id", siteId);
        if (e) throw e;
      }
      return { ok: true };
    }
    const patch: TablesUpdate<"workplans"> = { updated_by: me.id };
    const v = change.value;
    switch (change.field) {
      case "status":
        if (!STATUSES.includes(v as WorkplanStatus)) return { ok: false, error: "계획 상태 값이 올바르지 않습니다." };
        patch.status = v as WorkplanStatus;
        break;
      case "date":
        if (!DATE_RE.test(String(v))) return { ok: false, error: "날짜를 입력해 주세요." };
        patch.work_date = String(v);
        break;
      case "workers": {
        const n = Math.round(Number(v) || 0);
        if (n < 0 || n > 999) return { ok: false, error: "예정 인원은 0~999명으로 입력해 주세요." };
        patch.worker_count = n;
        break;
      }
      case "leader":
        patch.leader_name = text(v);
        break;
      case "reviewer":
        patch.reviewer_name = text(v);
        break;
    }
    const { error } = await db().from("workplans").update(patch).eq("site_id", siteId).in("id", ids);
    if (error) throw error;
    return { ok: true };
  }, "일괄 변경하지 못했습니다.");
}

/** 작업계획서 삭제 */
export async function deleteWorkplans(siteId: string, ids: string[]): Promise<WorkplanResult> {
  return guard(async () => {
    await requireSiteMember(siteId);
    if (!ids.length) return { ok: true };
    const { error } = await db().from("workplans").delete().eq("site_id", siteId).in("id", ids);
    if (error) throw error;
    return { ok: true };
  }, "작업계획서를 삭제하지 못했습니다.");
}
