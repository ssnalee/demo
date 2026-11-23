"use server";

import { AuthError, requireSiteMember, requireUser } from "../auth";
import type { SiteRole, SiteStatus } from "../database.types";
import { db } from "../supabase";

/** 화면에 내려주는 현장 정보 (DTO) */
export interface SiteDTO {
  id: string;
  name: string;
  constructionType: string | null;
  basementFloors: number;
  aboveFloors: number | null;
  startDate: string | null;
  endDate: string | null;
  address: string | null;
  status: SiteStatus;
  managerName: string | null;
  /** 내 역할 (관리자가 멤버가 아닌 현장을 볼 때는 null) */
  myRole: SiteRole | null;
  createdAt: string;
}

/** 현장 정보 입력값 (화면 입력칸 그대로 문자열) */
export interface SiteInput {
  name: string;
  type?: string;
  basement?: string;
  above?: string;
  start?: string;
  end?: string;
  address?: string;
}

export type SiteResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const text = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type SiteColumns = {
  name: string;
  construction_type: string | null;
  basement_floors: number;
  above_floors: number | null;
  start_date: string | null;
  end_date: string | null;
  address: string | null;
};

/** 입력값 검사·변환 (DB 제약과 같은 규칙) */
function parseSite(input: SiteInput): { error: string } | { value: SiteColumns } {
  const name = text(input.name);
  if (!name) return { error: "현장명을 입력해 주세요." }
  if (name.length > 100) return { error: "현장명은 100자 이내로 입력해 주세요." }
  const basement = text(input.basement) === null ? 0 : Number(input.basement);
  const above = text(input.above) === null ? null : Number(input.above);
  if (!Number.isInteger(basement) || basement < 0 || basement > 20) return { error: "지하 층수는 0~20 사이로 입력해 주세요." }
  if (above !== null && (!Number.isInteger(above) || above < 1 || above > 200))
    return { error: "지상 층수는 1~200 사이로 입력해 주세요." }
  const start = text(input.start);
  const end = text(input.end);
  if ((start && !DATE_RE.test(start)) || (end && !DATE_RE.test(end))) return { error: "날짜 형식이 올바르지 않습니다." }
  if (start && end && end < start) return { error: "준공 예정일은 착공일보다 빠를 수 없습니다." }
  return {
    value: {
      name,
      construction_type: text(input.type),
      basement_floors: basement,
      above_floors: above,
      start_date: start,
      end_date: end,
      address: text(input.address),
    },
  }
}

async function guard<T extends object>(fn: () => Promise<SiteResult<T>>, fallback: string): Promise<SiteResult<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: fallback };
  }
}

/** 내가 볼 수 있는 현장 목록 (일반: 멤버인 현장, 관리자: 전체). 삭제된 현장 제외 */
export async function listSites(): Promise<SiteResult<{ sites: SiteDTO[] }>> {
  return guard<{ sites: SiteDTO[] }>(async () => {
    const me = await requireUser();
    const { data: members, error: mErr } = await db().from("site_members").select("site_id, role").eq("user_id", me.id);
    if (mErr) throw mErr;
    const roleOf = new Map(members.map((m) => [m.site_id, m.role]));

    let q = db().from("sites").select("*").is("deleted_at", null).order("created_at", { ascending: true });
    if (!me.isAdmin) q = q.in("id", [...roleOf.keys()]);
    const { data: sites, error } = await q;
    if (error) throw error;

    const managerIds = [...new Set(sites.map((s) => s.manager_id).filter((v): v is string => !!v))];
    const names = new Map<string, string>();
    if (managerIds.length) {
      const { data: ps, error: pErr } = await db().from("profiles").select("id, name").in("id", managerIds);
      if (pErr) throw pErr;
      ps.forEach((p) => names.set(p.id, p.name));
    }

    return {
      ok: true,
      sites: sites.map((s) => ({
        id: s.id,
        name: s.name,
        constructionType: s.construction_type,
        basementFloors: s.basement_floors,
        aboveFloors: s.above_floors,
        startDate: s.start_date,
        endDate: s.end_date,
        address: s.address,
        status: s.status,
        managerName: s.manager_id ? (names.get(s.manager_id) ?? null) : null,
        myRole: roleOf.get(s.id) ?? null,
        createdAt: s.created_at,
      })),
    };
  }, "현장 목록을 불러오지 못했습니다.");
}

/** 현장 만들기: 만든 사람이 현장소장 (트리거가 site_members 에 현장소장으로 등록) */
export async function createSite(input: SiteInput): Promise<SiteResult<{ id: string }>> {
  return guard<{ id: string }>(async () => {
    const me = await requireUser();
    const p = parseSite(input);
    if ("error" in p) return { ok: false, error: p.error };
    const { data, error } = await db()
      .from("sites")
      .insert({ ...p.value, created_by: me.id, manager_id: me.id })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: data.id };
  }, "현장을 만들지 못했습니다.");
}

/** 현장 정보 수정 (현장 멤버) */
export async function updateSite(id: string, input: SiteInput): Promise<SiteResult> {
  return guard(async () => {
    await requireSiteMember(id);
    const p = parseSite(input);
    if ("error" in p) return { ok: false, error: p.error };
    const { error } = await db().from("sites").update(p.value).eq("id", id).is("deleted_at", null);
    if (error) throw error;
    return { ok: true };
  }, "현장 정보를 저장하지 못했습니다.");
}

/** 진행 중 ↔ 완료 (현장 멤버) */
export async function setSiteStatus(id: string, status: SiteStatus): Promise<SiteResult> {
  return guard(async () => {
    await requireSiteMember(id);
    if (status !== "active" && status !== "done") return { ok: false, error: "상태 값이 올바르지 않습니다." };
    const { error } = await db().from("sites").update({ status }).eq("id", id).is("deleted_at", null);
    if (error) throw error;
    return { ok: true };
  }, "현장 상태를 바꾸지 못했습니다.");
}

/** 현장 삭제 (현장소장·관리자). 기록 보존을 위해 삭제 표시만 */
export async function deleteSite(id: string): Promise<SiteResult> {
  return guard(async () => {
    const me = await requireSiteMember(id);
    if (!me.isAdmin && me.siteRole !== "site_manager") return { ok: false, error: "현장 삭제는 현장소장·관리자만 할 수 있습니다." };
    const { error } = await db().from("sites").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    return { ok: true };
  }, "현장을 삭제하지 못했습니다.");
}

