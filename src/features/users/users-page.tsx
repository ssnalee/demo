"use client";

import { Button, DataTable, EmptyState, PageHeader, Panel, type Column } from "@/components/ui";
import { useMe } from "@/features/auth/use-me";
import { cn } from "@/lib/cn";
import { listUsers, type UserRow } from "@/server/actions/users";
import { useCallback, useEffect, useState } from "react";
import { PasswordModal } from "./components/password-modal";
import { UserFormModal } from "./components/user-form-modal";

export const ROLE_LABEL = { admin: "관리자", user: "일반" } as const;
export const STATUS_LABEL = { active: "사용", suspended: "정지", withdrawn: "퇴사" } as const;
const STATUS_DOT = { active: "bg-success", suspended: "bg-[#f79009]", withdrawn: "bg-[#98a2b3]" } as const;

/** 계정 관리 (관리자만): 목록 · 등록 · 수정 · 비밀번호 초기화 */
export function UsersPage() {
  const me = useMe();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<UserRow | "new" | null>(null);
  const [pwFor, setPwFor] = useState<UserRow | null>(null);

  const apply = useCallback((r: Awaited<ReturnType<typeof listUsers>>) => {
    if (r.ok) {
      setUsers(r.users);
      setError("");
    } else setError(r.error);
  }, []);
  /** 등록·수정 후 다시 불러오기 */
  const reload = useCallback(() => void listUsers().then(apply), [apply]);

  // 관리자면 처음 한 번 불러오기
  useEffect(() => {
    if (!me?.isAdmin) return;
    let alive = true;
    void listUsers().then((r) => alive && apply(r));
    return () => {
      alive = false;
    };
  }, [me?.isAdmin, apply]);

  if (me === undefined) return null;
  if (!me?.isAdmin)
    return (
      <>
        <PageHeader title="계정 관리" />
        <Panel>
          <EmptyState>관리자만 볼 수 있는 화면입니다.</EmptyState>
        </Panel>
      </>
    );

  const columns: Column<UserRow>[] = [
    {
      key: "user",
      header: "계정",
      cell: (u) => (
        <div>
          <b className="text-[13.5px]">{u.name}</b>
          {u.id === me.id && <span className="ml-1.5 rounded-md bg-brand-soft px-1.5 py-px text-[11px] font-semibold text-brand-strong">나</span>}
          <div className="mt-0.5 text-[12px] text-sub">{u.username}</div>
        </div>
      ),
    },
    { key: "company", header: "소속", className: "text-center", headerClassName: "text-center", cell: (u) => u.companyName || <span className="text-[#98a2b3]">-</span> },
    { key: "phone", header: "연락처", className: "text-center", headerClassName: "text-center", cell: (u) => u.phone || <span className="text-[#98a2b3]">-</span> },
    {
      key: "role",
      header: "권한",
      className: "text-center",
      headerClassName: "text-center",
      cell: (u) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-[3px] text-[12px] font-semibold",
            u.systemRole === "admin" ? "bg-brand-soft text-brand-strong" : "bg-fill text-fg-2",
          )}
        >
          {ROLE_LABEL[u.systemRole]}
        </span>
      ),
    },
    {
      key: "status",
      header: "상태",
      className: "text-center",
      headerClassName: "text-center",
      cell: (u) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-fill px-2.5 py-[3px] text-[12px] font-semibold text-fg-2">
          <span className={cn("size-1.5 rounded-full", STATUS_DOT[u.status])} />
          {STATUS_LABEL[u.status]}
        </span>
      ),
    },
    {
      key: "created",
      header: "등록일",
      className: "text-center",
      headerClassName: "text-center",
      cell: (u) => <span className="text-[12.5px] text-sub">{u.createdAt.slice(0, 10)}</span>,
    },
    {
      key: "manage",
      header: "",
      cell: (u) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" onClick={() => setEditing(u)}>
            수정
          </Button>
          <Button size="sm" onClick={() => setPwFor(u)}>
            비밀번호
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="계정 관리"
        actions={
          <Button variant="primary" onClick={() => setEditing("new")}>
            + 계정 등록
          </Button>
        }
      />
      <Panel title={users ? `계정 ${users.length}개` : "계정"}>
        {error && <p className="mb-3 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">{error}</p>}
        {users === null && !error ? (
          <p className="py-10 text-center text-[13px] text-sub">불러오는 중…</p>
        ) : (
          <DataTable rows={users ?? []} columns={columns} onRowClick={(u) => setEditing(u)} empty="등록된 계정이 없습니다." />
        )}
      </Panel>

      <UserFormModal
        open={editing !== null}
        user={editing === "new" ? null : editing}
        isSelf={editing !== "new" && editing?.id === me.id}
        onClose={() => setEditing(null)}
        onSaved={reload}
      />
      <PasswordModal user={pwFor} onClose={() => setPwFor(null)} />
    </>
  );
}
