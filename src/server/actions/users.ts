"use server";

import { AuthError, USERNAME_RE, requireAdmin, toAuthEmail } from "../auth";
import type { SystemRole, UserStatus } from "../database.types";
import { db } from "../supabase";

/** 화면에 내려주는 계정 정보 (DTO) */
export interface UserRow {
  id: string;
  username: string;
  name: string;
  phone: string | null;
  companyName: string | null;
  systemRole: SystemRole;
  status: UserStatus;
  createdAt: string;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

const SYSTEM_ROLES: SystemRole[] = ["admin", "user"];
const STATUSES: UserStatus[] = ["active", "suspended", "withdrawn"];
const MIN_PASSWORD = 8;
/** 정지·퇴사 시 Auth 쪽 로그인·토큰 갱신도 막음 (약 100년) */
const BAN_FOREVER = "876000h";

const clean = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};

/** 오류를 화면용 문구로 (권한 오류는 그대로, 그 외는 일반 문구 + 서버 로그) */
async function run(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function listUsers(): Promise<{ ok: true; users: UserRow[] } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const { data, error } = await db()
      .from("profiles")
      .select("id, username, name, phone, company_name, system_role, status, created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return {
      ok: true,
      users: data.map((p) => ({
        id: p.id,
        username: p.username,
        name: p.name,
        phone: p.phone,
        companyName: p.company_name,
        systemRole: p.system_role,
        status: p.status,
        createdAt: p.created_at,
      })),
    };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "계정 목록을 불러오지 못했습니다." };
  }
}

export interface UserInput {
  username?: string;
  password?: string;
  name: string;
  phone?: string;
  companyName?: string;
  systemRole: SystemRole;
  status?: UserStatus;
}

/** 계정 등록: Auth 사용자 생성 → (트리거가 profiles 생성) → 추가 정보 저장 */
export async function createUser(input: UserInput): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const username = String(input.username ?? "").trim().toLowerCase();
    const name = clean(input.name);
    if (!USERNAME_RE.test(username)) return { ok: false, error: "아이디는 영문 소문자·숫자·._- 3~30자로 입력해 주세요." };
    if (!name) return { ok: false, error: "이름을 입력해 주세요." };
    if (!input.password || input.password.length < MIN_PASSWORD)
      return { ok: false, error: `비밀번호는 ${MIN_PASSWORD}자 이상으로 입력해 주세요.` };
    if (!SYSTEM_ROLES.includes(input.systemRole)) return { ok: false, error: "권한 값이 올바르지 않습니다." };

    const { data: dup } = await db().from("profiles").select("id").eq("username", username).maybeSingle();
    if (dup) return { ok: false, error: "이미 사용 중인 아이디입니다." };

    const { data, error } = await db().auth.admin.createUser({
      email: toAuthEmail(username),
      password: input.password,
      email_confirm: true,
      user_metadata: { username, name },
    });
    if (error || !data.user) {
      if (error?.code === "email_exists") return { ok: false, error: "이미 사용 중인 아이디입니다." };
      throw error ?? new Error("createUser failed");
    }
    const { error: upErr } = await db()
      .from("profiles")
      .update({ name, phone: clean(input.phone), company_name: clean(input.companyName), system_role: input.systemRole })
      .eq("id", data.user.id);
    if (upErr) throw upErr;
    return { ok: true };
  });
}

/** 계정 정보 수정 (아이디는 변경 불가) */
export async function updateUser(id: string, input: UserInput): Promise<ActionResult> {
  return run(async () => {
    const me = await requireAdmin();
    const name = clean(input.name);
    const status = input.status ?? "active";
    if (!name) return { ok: false, error: "이름을 입력해 주세요." };
    if (!SYSTEM_ROLES.includes(input.systemRole) || !STATUSES.includes(status))
      return { ok: false, error: "권한·상태 값이 올바르지 않습니다." };
    // 자기 자신의 관리자 권한·사용 상태를 없애서 잠기는 것 방지
    if (id === me.id && (input.systemRole !== "admin" || status !== "active"))
      return { ok: false, error: "내 계정의 관리자 권한과 사용 상태는 바꿀 수 없습니다." };

    const { error } = await db()
      .from("profiles")
      .update({ name, phone: clean(input.phone), company_name: clean(input.companyName), system_role: input.systemRole, status })
      .eq("id", id);
    if (error) throw error;
    // 정지·퇴사면 Auth 로그인도 차단, 다시 사용이면 해제
    const { error: banErr } = await db().auth.admin.updateUserById(id, {
      ban_duration: status === "active" ? "none" : BAN_FOREVER,
    });
    if (banErr) throw banErr;
    return { ok: true };
  });
}

/** 관리자가 비밀번호를 새로 지정 */
export async function resetPassword(id: string, password: string): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    if (!password || password.length < MIN_PASSWORD)
      return { ok: false, error: `비밀번호는 ${MIN_PASSWORD}자 이상으로 입력해 주세요.` };
    const { error } = await db().auth.admin.updateUserById(id, { password });
    if (error) throw error;
    return { ok: true };
  });
}
