import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 로그인 없이 볼 수 있는 경로 */
const PUBLIC_PATHS = ["/login"];

/**
 * 모든 요청에서: Supabase 세션 쿠키 갱신 + 로그인 안 했으면 /login 으로.
 * (낙관적 확인. 실제 권한 확인은 서버 액션·데이터 함수의 requireUser/requireAdmin 에서 다시 함)
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLIC_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // 세션 확인·갱신 (만료된 토큰이면 여기서 새로 받아 쿠키에 씀)
  const { data } = await supabase.auth.getClaims();
  const loggedIn = !!data?.claims?.sub;
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));

  const redirectTo = (to: string) => {
    const res = NextResponse.redirect(new URL(to, request.url));
    // 갱신된 세션 쿠키도 함께 전달
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!loggedIn && !isPublic) return redirectTo("/login");
  if (loggedIn && path === "/login") return redirectTo("/dashboard");
  return response;
}

export const config = {
  // 정적 파일·이미지·파비콘은 제외
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
