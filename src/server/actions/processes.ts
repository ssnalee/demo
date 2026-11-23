"use server";

import { AuthError, requireSiteMember } from "../auth";
import type { ProcessStage, TablesUpdate } from "../database.types";
import { db } from "../supabase";

/** 화면용 공정 (DTO). after 는 선행 공정 표시 문구 ("○○ 완료 후") */
export interface ProcessDTO {
  id: string;
  title: string;
  trade: string;
  floor: string;
  stage: string;
  company: string;
  start: string;
  end: string;
  progress: number;
  predecessorId: string | null;
  predecessorTrade: string | null;
  after: string;
  note: string;
  updatedAt: string;
}

export interface ProcessInput {
  /** 있으면 수정, 없으면 등록 */
  id?: string;
  trade: string;
  floor: string;
  stage?: string;
  company?: string;
  start: string;
  end: string;
  progress?: number;
  predecessorId?: string | null;
  predecessorTrade?: string | null;
  note?: string;
}

/** 일괄 변경: 기간 옮기기(일) 또는 한 칸 값 지정 */
export type ProcessBulkChange =
  | { kind: "shift"; days: number }
  | { kind: "set"; field: "progress" | "start" | "end" | "company"; value: string | number };

export type ProcessResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const STAGES: ProcessStage[] = ["준비·자재반입", "철거", "먹매김", "설치", "1차 시공", "2차 시공", "마감", "검측·확인", "보수·정리"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const text = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};
const pct = (v: unknown) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
const addDays = (d: string, n: number) => new Date(Date.parse(d + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);

async function guard<T extends object>(fn: () => Promise<ProcessResult<T>>, fallback: string): Promise<ProcessResult<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: fallback };
  }
}

/** 현장 공정 목록 (시작일 순) */
export async function listProcesses(siteId: string): Promise<ProcessResult<{ items: ProcessDTO[] }>> {
  return guard<{ items: ProcessDTO[] }>(async () => {
    await requireSiteMember(siteId);
    const { data, error } = await db()
      .from("processes")
      .select("*")
      .eq("site_id", siteId)
      .order("start_date", { ascending: true })
      .order("end_date", { ascending: true });
    if (error) throw error;
    const titleOf = new Map(data.map((p) => [p.id, p.title]));
    return {
      ok: true,
      items: data.map((p) => ({
        id: p.id,
        title: p.title,
        trade: p.trade,
        floor: p.floor,
        stage: p.stage ?? "",
        company: p.company_name ?? "",
        start: p.start_date,
        end: p.end_date,
        progress: p.progress,
        predecessorId: p.predecessor_process_id,
        predecessorTrade: p.predecessor_trade,
        after: p.predecessor_process_id
          ? `${titleOf.get(p.predecessor_process_id) ?? "삭제된 공정"} 완료 후`
          : p.predecessor_trade
            ? `${p.predecessor_trade} 완료 후`
            : "",
        note: p.note ?? "",
        updatedAt: p.updated_at,
      })),
    };
  }, "공정 목록을 불러오지 못했습니다.");
}

/** 공정 등록·수정 */
export async function saveProcess(siteId: string, input: ProcessInput): Promise<ProcessResult<{ id: string; updated: boolean }>> {
  return guard<{ id: string; updated: boolean }>(async () => {
    const me = await requireSiteMember(siteId);
    const trade = text(input.trade);
    const floor = text(input.floor);
    const stage = text(input.stage);
    if (!trade || !floor) return { ok: false, error: "공종과 층·구역을 선택해 주세요." };
    if (stage && !STAGES.includes(stage as ProcessStage)) return { ok: false, error: "작업 단계 값이 올바르지 않습니다." };
    if (!DATE_RE.test(input.start) || !DATE_RE.test(input.end)) return { ok: false, error: "시작일과 종료일을 입력해 주세요." };
    if (input.end < input.start) return { ok: false, error: "종료일은 시작일보다 빠를 수 없습니다." };
    const predecessorId = text(input.predecessorId);
    const predecessorTrade = predecessorId ? null : text(input.predecessorTrade);
    if (predecessorId && predecessorId === input.id) return { ok: false, error: "자기 자신을 선행 공정으로 지정할 수 없습니다." };

    const row = {
      trade,
      floor,
      stage: stage as ProcessStage | null,
      company_name: text(input.company),
      start_date: input.start,
      end_date: input.end,
      progress: pct(input.progress),
      predecessor_process_id: predecessorId,
      predecessor_trade: predecessorTrade,
      note: text(input.note),
      updated_by: me.id,
    };

    if (input.id) {
      const { data, error } = await db()
        .from("processes")
        .update(row)
        .eq("id", input.id)
        .eq("site_id", siteId)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) return { ok: false, error: "수정할 공정을 찾지 못했습니다." };
      return { ok: true, id: data.id, updated: true };
    }
    const { data, error } = await db()
      .from("processes")
      .insert({ ...row, site_id: siteId, created_by: me.id })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: data.id, updated: false };
  }, "공정을 저장하지 못했습니다.");
}

/** 진행률만 바로 변경 (목록에서) */
export async function setProcessProgress(siteId: string, id: string, progress: number): Promise<ProcessResult> {
  return guard(async () => {
    const me = await requireSiteMember(siteId);
    const { error } = await db()
      .from("processes")
      .update({ progress: pct(progress), updated_by: me.id })
      .eq("id", id)
      .eq("site_id", siteId);
    if (error) throw error;
    return { ok: true };
  }, "진행률을 바꾸지 못했습니다.");
}

/** 선택한 공정 일괄 변경 */
export async function bulkUpdateProcesses(siteId: string, ids: string[], change: ProcessBulkChange): Promise<ProcessResult> {
  return guard(async () => {
    const me = await requireSiteMember(siteId);
    if (!ids.length) return { ok: true };
    if (change.kind === "shift") {
      const days = Math.round(Number(change.days) || 0);
      if (!days) return { ok: false, error: "옮길 일수를 입력해 주세요." };
      const { data, error } = await db().from("processes").select("id, start_date, end_date").eq("site_id", siteId).in("id", ids);
      if (error) throw error;
      for (const p of data) {
        const { error: e } = await db()
          .from("processes")
          .update({ start_date: addDays(p.start_date, days), end_date: addDays(p.end_date, days), updated_by: me.id })
          .eq("id", p.id)
          .eq("site_id", siteId);
        if (e) throw e;
      }
      return { ok: true };
    }
    const patch: TablesUpdate<"processes"> = { updated_by: me.id };
    if (change.field === "progress") patch.progress = pct(change.value);
    else if (change.field === "company") patch.company_name = text(change.value);
    else {
      const d = String(change.value);
      if (!DATE_RE.test(d)) return { ok: false, error: "날짜를 입력해 주세요." };
      if (change.field === "start") patch.start_date = d;
      else patch.end_date = d;
    }
    const { error } = await db().from("processes").update(patch).eq("site_id", siteId).in("id", ids);
    // 시작일·종료일 순서가 뒤집히면 DB 제약(processes_period_order)이 막음
    if (error?.code === "23514") return { ok: false, error: "종료일이 시작일보다 빠른 공정이 생겨서 바꿀 수 없습니다." };
    if (error) throw error;
    return { ok: true };
  }, "일괄 변경하지 못했습니다.");
}

/** 공정 삭제 (선행으로 지정한 공정은 선행 칸만 비워짐) */
export async function deleteProcesses(siteId: string, ids: string[]): Promise<ProcessResult> {
  return guard(async () => {
    await requireSiteMember(siteId);
    if (!ids.length) return { ok: true };
    const { error } = await db().from("processes").delete().eq("site_id", siteId).in("id", ids);
    if (error) throw error;
    return { ok: true };
  }, "공정을 삭제하지 못했습니다.");
}
