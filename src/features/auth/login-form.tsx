"use client";

import { Button, Field, Input } from "@/components/ui";
import { LogoMark } from "@/components/layout/icons";
import { signIn, type SignInState } from "@/server/actions/auth";
import { useActionState } from "react";

export function LoginForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  return (
    <div className="w-full max-w-[380px] rounded-[20px] border border-line/60 bg-surface p-7 shadow-card sm:p-8">
      <div className="mb-7 flex items-center gap-2.5">
        <LogoMark aria-hidden />
        <strong className="text-[16px] font-bold tracking-[-0.03em]">현장 안전관리</strong>
      </div>
      <h1 className="text-[22px] font-bold tracking-[-0.03em]">로그인</h1>
      <p className="mt-1 mb-6 text-[13px] text-sub">관리자에게 받은 아이디와 비밀번호를 입력해 주세요.</p>
      <form action={action}>
        <Field label="아이디">
          <Input name="username" autoComplete="username" autoCapitalize="none" autoFocus defaultValue={state.username} required />
        </Field>
        <Field label="비밀번호">
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>
        {state.error && (
          <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
            {state.error}
          </p>
        )}
        <Button type="submit" variant="primary" className="w-full" disabled={pending}>
          {pending ? "로그인 중…" : "로그인"}
        </Button>
      </form>
    </div>
  );
}
