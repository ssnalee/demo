"use client";

import { Button, Disclosure, EmptyState, Field, Input, Select, toast, confirmDialog } from "@/components/ui";
import { cn } from "@/lib/cn";
import { today } from "@/lib/date";
import { newId } from "@/lib/id";
import { useCollection } from "@/lib/storage/hooks";
import { knownCompanies, useGroupedMasters } from "@/lib/storage/masters";
import { read, write } from "@/lib/storage/store";
import { useMemo, useState } from "react";
import { ATTENDANCE_STATUSES_BULK, WORKER_INACTIVE, type Attendance, type Worker } from "../types";

type RowState = { checked?: boolean; trade?: string; status?: string };

/** 출역 한 번에 등록 (원본 atbRender / atbCheck / atbSave) */
export function AttendanceBulk({ onSaved }: { onSaved: (date: string) => void }) {
  const { items: workers } = useCollection<Worker>("workers");
  const { items: attendance } = useCollection<Attendance>("attendance");
  const { floors, trades, floorGroups, tradeGroups } = useGroupedMasters();
  const [date, setDate] = useState(today);
  const [floor, setFloor] = useState("");
  const [inTime, setIn] = useState("07:00");
  const [outTime, setOut] = useState("17:00");
  const [company, setCompany] = useState("");
  const [rows, setRows] = useState<Record<string, RowState>>({});

  // 원본은 업체 목록을 렌더링마다 다시 수집 (근로자·출역 변경 시 갱신)
  const companies = useMemo(() => (workers && attendance ? knownCompanies() : []), [workers, attendance]);
  const comp = companies.includes(company) ? company : "";
  const done = useMemo(() => new Set(attendance.filter((x) => x.date === date).map((x) => x.workerId)), [attendance, date]);
  const list = useMemo(
    () =>
      workers
        .filter((w) => w.status !== WORKER_INACTIVE && (!comp || w.company === comp))
        .sort((x, y) => (x.company || "").localeCompare(y.company || "", "ko") || x.name.localeCompare(y.name, "ko")),
    [workers, comp],
  );

  const isChecked = (w: Worker) => !done.has(w.id) && !!rows[w.id]?.checked;
  const tradeOf = (w: Worker) => rows[w.id]?.trade ?? (w.trade || trades[0] || "");
  const statusOf = (w: Worker) => rows[w.id]?.status ?? ATTENDANCE_STATUSES_BULK[0];
  const count = list.filter(isChecked).length;
  const patch = (id: string, p: RowState) => setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...p } }));

  const check = (mode: "all" | "none" | "prev") => {
    let prev: Set<string> | null = null;
    if (mode === "prev") {
      const before = attendance
        .filter((x) => x.date < date && x.status !== "결근")
        .map((x) => x.date)
        .sort()
        .pop();
      if (!before) return toast("이전 출역 기록이 없습니다.", "danger");
      prev = new Set(attendance.filter((x) => x.date === before && x.status !== "결근").map((x) => x.workerId));
    }
    setRows((old) => {
      const next = { ...old };
      list.forEach((w) => {
        if (done.has(w.id)) return;
        next[w.id] = { ...next[w.id], checked: mode === "all" ? true : mode === "none" ? false : !!prev?.has(w.id) };
      });
      return next;
    });
  };

  const save = async () => {
    if (!date) return toast("출역일자를 선택해 주세요.", "danger");
    const picked = list.filter(isChecked);
    if (!picked.length) return toast("출역 처리할 인원을 체크해 주세요.", "danger");
    if (!(await confirmDialog({ title: `출역 ${picked.length}명을 저장할까요?`, message: `${date} 출역`, confirmText: "저장" }))) return;
    const f = floor || floors[0] || "";
    const add: Attendance[] = picked.map((w) => {
      const st = statusOf(w);
      return {
        id: newId(),
        date,
        workerId: w.id,
        workerName: w.name,
        company: w.company,
        dailyWage: Number(w.dailyWage) || 0,
        floor: f,
        trade: tradeOf(w),
        inTime: st === "결근" ? "" : inTime,
        outTime: st === "결근" ? "" : outTime,
        status: st,
      };
    });
    write("attendance", [...add.reverse(), ...read<Attendance>("attendance")]);
    onSaved(date);
    toast(`출역 ${picked.length}명을 저장했습니다.`);
  };

  return (
    <Disclosure title="출역 한 번에 등록" description="오늘 나온 사람만 체크해서 한 번에 출역 처리합니다">
      <div className="grid grid-cols-2 gap-x-3 lg:grid-cols-5">
        <Field label="출역일자">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="층·구역">
          <Select groups={floorGroups} value={floor} onChange={(e) => setFloor(e.target.value)} />
        </Field>
        <Field label="출근">
          <Input type="time" value={inTime} onChange={(e) => setIn(e.target.value)} />
        </Field>
        <Field label="퇴근">
          <Input type="time" value={outTime} onChange={(e) => setOut(e.target.value)} />
        </Field>
        <Field label="업체 보기" className="col-span-2 lg:col-span-1">
          <Select placeholder="전체 업체" options={companies} value={comp} onChange={(e) => setCompany(e.target.value)} />
        </Field>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => check("all")}>
          전체 선택
        </Button>
        <Button size="sm" onClick={() => check("none")}>
          전체 해제
        </Button>
        <Button size="sm" onClick={() => check("prev")}>
          전날 나온 사람 선택
        </Button>
        <span className="text-[13px] text-sub">{count}명 선택</span>
        <Button variant="primary" className="ml-auto" onClick={save}>
          선택한 인원 출역 저장
        </Button>
      </div>
      {list.length ? (
        <div className="max-h-[420px] overflow-y-auto rounded-xl border border-line">
          {list.map((w) => {
            const isDone = done.has(w.id);
            return (
              <div
                key={w.id}
                className={cn(
                  "grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 border-b border-line-2 px-3 py-2 last:border-b-0 sm:grid-cols-[auto_1fr_160px_96px]",
                  isDone ? "bg-bg opacity-60" : isChecked(w) && "bg-fill",
                )}
              >
                <input
                  type="checkbox"
                  className="size-4"
                  aria-label={`${w.name} 선택`}
                  disabled={isDone}
                  title={isDone ? "이미 출역 등록됨" : undefined}
                  checked={isChecked(w)}
                  onChange={(e) => patch(w.id, { checked: e.target.checked })}
                />
                <div className="min-w-0 text-[13.5px] font-semibold">
                  {w.name}
                  <small className="ml-1.5 text-xs font-normal text-sub">
                    {w.company || "소속 미기재"}
                    {isDone ? " · 등록됨" : ""}
                  </small>
                </div>
                <div className="col-span-2 grid grid-cols-[1fr_96px] gap-1.5 sm:col-span-2 sm:grid-cols-[160px_96px]">
                  <Select compact groups={tradeGroups} value={tradeOf(w)} onChange={(e) => patch(w.id, { trade: e.target.value })} />
                  <Select
                    compact
                    options={[...ATTENDANCE_STATUSES_BULK]}
                    value={statusOf(w)}
                    onChange={(e) => patch(w.id, { status: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState>등록된 근로자가 없습니다. 위에서 근로자를 먼저 등록해 주세요.</EmptyState>
      )}
    </Disclosure>
  );
}
