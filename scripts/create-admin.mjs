// 기본 관리자 계정 만들기 (한 번만 실행)
// 실행: npm run create-admin -- <아이디> <이름> [비밀번호]
//   비밀번호를 생략하면 임의로 만들어 출력함 → 로그인 후 계정 관리에서 바꿀 것
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);

const [username = "admin", name = "관리자", given] = process.argv.slice(2);
if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
  console.error("✗ 아이디는 영문 소문자·숫자·._- 3~30자로 입력해 주세요.");
  process.exit(1);
}
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ .env 에 SUPABASE_URL · SUPABASE_SECRET_KEY 를 넣어 주세요.");
  process.exit(1);
}
const password = given ?? randomBytes(9).toString("base64url");
if (password.length < 8) {
  console.error("✗ 비밀번호는 8자 이상이어야 합니다.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: ws } });
const email = `${username}@${process.env.AUTH_EMAIL_DOMAIN || "safety.local"}`;

const { data, error } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { username, name },
});
if (error) {
  console.error(`✗ 계정을 만들지 못했습니다: ${error.message}`);
  process.exit(1);
}
// 가입 트리거가 만든 profiles 에 관리자 권한 지정
const { error: upErr } = await db.from("profiles").update({ system_role: "admin", name }).eq("id", data.user.id);
if (upErr) {
  console.error(`✗ 관리자 권한 지정 실패: ${upErr.message}`);
  process.exit(1);
}
console.log(`✓ 관리자 계정을 만들었습니다.\n  아이디: ${username}\n  이름: ${name}\n  비밀번호: ${given ? "(입력한 값)" : password}`);
