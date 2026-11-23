import "server-only";

import { createClient, type RealtimeClientOptions } from "@supabase/supabase-js";
import ws from "ws";
import type { Database } from "./database.types";

/**
 * 서버 전용 Supabase 클라이언트 (Secret key, 예전 이름 service_role 키).
 * - RLS 를 건너뛰므로 브라우저로 절대 나가면 안 됨 ("server-only" 가 클라이언트 번들 포함을 막음).
 * - 현장 멤버 확인 등 권한 판단은 이 클라이언트를 쓰는 서버 코드(Data Access Layer)에서 반드시 할 것.
 */
function createDbClient() {
  const url = process.env.SUPABASE_URL;
  // 새 키 체계(sb_secret_…)는 SUPABASE_SECRET_KEY, 예전 service_role 키 이름도 허용
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL · SUPABASE_SECRET_KEY 환경변수가 없습니다. .env 를 확인해 주세요.");
  }
  return createClient<Database>(url, key, {
    // 서버에서 service_role 로만 쓰므로 세션 저장·토큰 갱신 불필요
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    // Node 20 에는 기본 WebSocket 이 없어 클라이언트 생성 시 오류 → ws 로 대신 (Node 22 이상이면 없어도 됨).
    // ws 의 생성자 타입이 Supabase 의 WebSocketLike 타입과 조금 달라 형변환
    realtime: { transport: ws as unknown as RealtimeClientOptions["transport"] },
  });
}

let client: ReturnType<typeof createDbClient> | null = null;

/** 서버 코드에서 DB 접근: db().from("processes").select() … (요청 간 재사용) */
export function db() {
  client ??= createDbClient();
  return client;
}
