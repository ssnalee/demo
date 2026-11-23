"use client";

import { Button, Field, FormGrid, Input, Modal, Select, toast } from "@/components/ui";
import type { SystemRole, UserStatus } from "@/server/database.types";
import { createUser, updateUser, type UserInput, type UserRow } from "@/server/actions/users";
import { useState } from "react";

type Form = Required<Omit<UserInput, "status">> & { status: UserStatus };

const fromRow = (u: UserRow | null): Form => ({
  username: u?.username ?? "",
  password: "",
  name: u?.name ?? "",
  phone: u?.phone ?? "",
  companyName: u?.companyName ?? "",
  systemRole: u?.systemRole ?? "user",
  status: u?.status ?? "active",
});

/** 계정 등록 · 수정 팝업 (user 가 없으면 등록) */
export function UserFormModal({
  open,
  user,
  isSelf,
  onClose,
  onSaved,
}: {
  open: boolean;
  user: UserRow | null;
  isSelf: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  if (!open) return null;
  // 열 때마다 새 값으로 시작
  return <Dialog key={user?.id ?? "new"} user={user} isSelf={isSelf} onClose={onClose} onSaved={onSaved} />;
}

function Dialog({ user, isSelf, onClose, onSaved }: { user: UserRow | null; isSelf: boolean; onClose: () => void; onSaved: () => void }) {
  const isNew = !user;
  const [f, setF] = useState<Form>(() => fromRow(user));
  const [busy, setBusy] = useState(false);
  const bind = <K extends keyof Form>(k: K) => ({
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((d) => ({ ...d, [k]: e.target.value })),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = isNew ? await createUser(f) : await updateUser(user.id, f);
    setBusy(false);
    if (!r.ok) return toast(r.error, "danger");
    toast(isNew ? "계정을 등록했습니다." : "계정 정보를 저장했습니다.");
    onSaved();
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "계정 등록" : "계정 수정"}
      description={isNew ? "등록한 아이디와 비밀번호를 사용자에게 전달해 주세요." : `아이디 ${user.username} (변경 불가)`}
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button type="submit" form="user-form" variant="primary" disabled={busy}>
            {busy ? "저장 중…" : "저장"}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit}>
        {isNew && (
          <FormGrid>
            <Field label="아이디" required hint="영문 소문자·숫자·._- 3~30자">
              <Input required autoFocus autoCapitalize="none" pattern="[a-z0-9._\-]{3,30}" {...bind("username")} />
            </Field>
            <Field label="비밀번호" required hint="8자 이상">
              <Input required type="password" minLength={8} autoComplete="new-password" {...bind("password")} />
            </Field>
          </FormGrid>
        )}
        <FormGrid>
          <Field label="이름" required>
            <Input required autoFocus={!isNew} {...bind("name")} />
          </Field>
          <Field label="연락처">
            <Input type="tel" placeholder="010-0000-0000" {...bind("phone")} />
          </Field>
          <Field label="소속 업체">
            <Input placeholder="원청·협력업체명" {...bind("companyName")} />
          </Field>
          <Field label="권한" hint={isSelf ? "내 계정의 권한은 바꿀 수 없습니다." : undefined}>
            <Select
              disabled={isSelf}
              options={[
                { value: "user", label: "일반" },
                { value: "admin", label: "관리자 (계정 관리 가능)" },
              ]}
              value={f.systemRole}
              onChange={(e) => setF((d) => ({ ...d, systemRole: e.target.value as SystemRole }))}
            />
          </Field>
          {!isNew && (
            <Field label="상태" hint={isSelf ? "내 계정의 상태는 바꿀 수 없습니다." : "정지·퇴사 계정은 로그인할 수 없습니다."}>
              <Select
                disabled={isSelf}
                options={[
                  { value: "active", label: "사용" },
                  { value: "suspended", label: "정지" },
                  { value: "withdrawn", label: "퇴사" },
                ]}
                value={f.status}
                onChange={(e) => setF((d) => ({ ...d, status: e.target.value as UserStatus }))}
              />
            </Field>
          )}
        </FormGrid>
      </form>
    </Modal>
  );
}
