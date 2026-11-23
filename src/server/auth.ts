import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { SiteRole } from "./database.types";
import { db } from "./supabase";

/** 로그인 아이디 규칙 (profiles.username 과 같음) */
export const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;
/** Supabase Auth 는 이메일이 필요하므로 아이디를 내부 이메일로 바꿔서 사용 (화면에는 아이디만 표시) */
export const toAuthEmail = (username: string) =>
  `${username.trim().toLowerCase()}@${process.env.AUTH_EMAIL_DOMAIN || "safety.local"}`;

/**
 * 로그인 세션용 Supabase 클라이언트 (쿠키에 세션 저장·갱신).
 * Publishable key 를 서버에서만 사용 — 데이터 읽기/쓰기는 db()(Secret key)로 하고, 이 클라이언트는 인증에만 씀.
 */
export async function createSessionClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLIC_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL · SUPABASE_PUBLISHABLE_KEY 환경변수가 없습니다. .env 를 확인해 주세요.");
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // 서버 컴포넌트 렌더 중에는 쿠키를 쓸 수 없음 → 세션 갱신은 proxy 가 처리
        }
      },
    },
  });
}

export interface CurrentUser {
  id: string;
  username: string;
  name: string;
  isAdmin: boolean;
}

/** 지금 로그인한 사용자 (사용 중인 계정만). 한 요청 안에서는 한 번만 조회 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const sb = await createSessionClient();
  // getClaims: 세션 JWT 를 검증해서 사용자 id 를 얻음 (쿠키 값을 그대로 믿지 않음)
  const { data } = await sb.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  const { data: p } = await db()
    .from("profiles")
    .select("id, username, name, system_role, status")
    .eq("id", id)
    .maybeSingle();
  if (!p || p.status !== "active") return null;
  return { id: p.id, username: p.username, name: p.name, isAdmin: p.system_role === "admin" };
});

export class AuthError extends Error {}

/** 서버 액션·데이터 함수 맨 앞에서 호출: 로그인 안 했으면 오류 */
export async function requireUser(): Promise<CurrentUser> {
  const me = await getCurrentUser();
  if (!me) throw new AuthError("로그인이 필요합니다.");
  return me;
}

/** 관리자만 */
export async function requireAdmin(): Promise<CurrentUser> {
  const me = await requireUser();
  if (!me.isAdmin) throw new AuthError("관리자만 할 수 있습니다.");
  return me;
}

/** 그 현장 멤버만 (관리자는 통과). 현장별 기록을 읽고 쓰기 전에 반드시 호출 */
export async function requireSiteMember(siteId: string): Promise<CurrentUser & { siteRole: SiteRole | null }> {
  const me = await requireUser();
  const { data } = await db()
    .from("site_members")
    .select("role")
    .eq("site_id", siteId)
    .eq("user_id", me.id)
    .maybeSingle();
  if (!data && !me.isAdmin) throw new AuthError("이 현장의 멤버가 아닙니다.");
  return { ...me, siteRole: data?.role ?? null };
}
