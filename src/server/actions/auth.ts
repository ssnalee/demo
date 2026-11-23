"use server";

import { redirect } from "next/navigation";
import { USERNAME_RE, createSessionClient, getCurrentUser, toAuthEmail, type CurrentUser } from "../auth";
import { db } from "../supabase";

export interface SignInState {
  error?: string;
  username?: string;
}

/** 로그인 (아이디·비밀번호). 성공하면 대시보드로 이동 */
export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "아이디와 비밀번호를 입력해 주세요.", username };
  if (!USERNAME_RE.test(username)) return { error: "아이디 또는 비밀번호가 올바르지 않습니다.", username };

  const sb = await createSessionClient();
  const { data, error } = await sb.auth.signInWithPassword({ email: toAuthEmail(username), password });
  if (error || !data.user) return { error: "아이디 또는 비밀번호가 올바르지 않습니다.", username };

  // 정지·퇴사 계정은 로그인 불가
  const { data: p } = await db().from("profiles").select("status").eq("id", data.user.id).maybeSingle();
  if (!p || p.status !== "active") {
    await sb.auth.signOut();
    return { error: "사용할 수 없는 계정입니다. 관리자에게 문의해 주세요.", username };
  }
  redirect("/dashboard");
}

/** 로그아웃 */
export async function signOut() {
  const sb = await createSessionClient();
  await sb.auth.signOut();
  redirect("/login");
}

/** 화면 표시용 내 정보 (이름·관리자 여부) */
export async function getMe(): Promise<CurrentUser | null> {
  return getCurrentUser();
}
