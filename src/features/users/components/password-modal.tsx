"use client";

import { Button, Field, Input, Modal, toast } from "@/components/ui";
import { resetPassword, type UserRow } from "@/server/actions/users";
import { useState } from "react";

/** 관리자가 비밀번호를 새로 지정 */
export function PasswordModal({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  if (!user) return null;
  return <Dialog key={user.id} user={user} onClose={onClose} />;
}

function Dialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) return toast("비밀번호가 서로 다릅니다.", "danger");
    setBusy(true);
    const r = await resetPassword(user.id, pw);
    setBusy(false);
    if (!r.ok) return toast(r.error, "danger");
    toast(`${user.name}님의 비밀번호를 바꿨습니다.`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="비밀번호 초기화"
      description={`${user.name} (${user.username})의 새 비밀번호를 지정합니다.`}
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button type="submit" form="pw-form" variant="primary" disabled={busy}>
            {busy ? "저장 중…" : "저장"}
          </Button>
        </>
      }
    >
      <form id="pw-form" onSubmit={submit}>
        <Field label="새 비밀번호" required hint="8자 이상">
          <Input required autoFocus type="password" minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field label="새 비밀번호 확인" required>
          <Input required type="password" minLength={8} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
