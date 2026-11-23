// Supabase 연결 확인: 마이그레이션한 테이블에 접근되는지 건수만 조회
// 실행: npm run db:check   (.env.local → .env 순서로 SUPABASE_URL · SUPABASE_SECRET_KEY 를 읽음)
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ .env.local(또는 .env)에 SUPABASE_URL · SUPABASE_SECRET_KEY 를 넣어 주세요.");
  process.exit(1);
}

// Node 20 에는 기본 WebSocket 이 없어 ws 로 대신
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: ws } });
let failed = false;
for (const table of ["sites", "profiles", "site_members", "processes"]) {
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
  if (error) {
    failed = true;
    console.error(`✗ ${table}: ${error.message}`);
  } else {
    console.log(`✓ ${table}: ${count}건`);
  }
}
process.exit(failed ? 1 : 0);
