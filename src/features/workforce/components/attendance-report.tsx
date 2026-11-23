"use client";

import { Button, DataTable, Field, FormGrid, Input, Notice, Panel, Select, toast, type Column } from "@/components/ui";
import { monthStart, today } from "@/lib/date";
import { downloadCSV } from "@/lib/download";
import { won } from "@/lib/format";
import { escapeHtml as esc, printHtml } from "@/lib/print";
import { useCollection } from "@/lib/storage/hooks";
import { getSiteInfo } from "@/lib/storage/site-info";
import { useMemo, useState } from "react";
import {
  attendanceDailyWage,
  attendanceHours,
  attendancePay,
  attendanceWageFactor,
  filterAttendance,
  summarizeAttendance,
  type PersonalAttendanceSummary,
} from "../lib";
import type { Attendance, Worker } from "../types";

const WAGE_NOTE =
  "노임 계산 기준: 정상 출역 1일, 조퇴·외출 0.5일, 결근 0일. 출역 등록 시점의 1일 노임을 기록하여 이후 노임 변경이 과거 기록에 영향을 주지 않도록 합니다. 기존 출역기록은 현재 근로자 등록 노임을 기준으로 계산합니다.";

const SUM_HEADS = ["근로자", "소속업체", "출역", "결근", "조퇴", "외출", "유급 환산일수", "노무비 합계"];
const DETAIL_HEADS = ["날짜", "근로자", "소속업체", "층·구역", "공종", "출근~퇴근", "상태", "1일 노임", "적용일수", "당일 노무비"];

/** 개인별 출역집계표 */
export function AttendanceReport() {
  const { items: workers } = useCollection<Worker>("workers");
  const { items: attendance } = useCollection<Attendance>("attendance");
  const [start, setStart] = useState(monthStart);
  const [end, setEnd] = useState(today);
  const [workerId, setWorkerId] = useState("");
  const [company, setCompany] = useState("");

  const companies = useMemo(
    () => [...new Set(workers.map((x) => x.company).filter(Boolean))].sort(),
    [workers],
  );
  const wid = workers.some((x) => x.id === workerId) ? workerId : "";
  const comp = companies.includes(company) ? company : "";

  const rows = useMemo(() => filterAttendance(attendance, { start, end, workerId: wid, company: comp }), [attendance, start, end, wid, comp]);
  const summary = useMemo(() => summarizeAttendance(rows, workers), [rows, workers]);
  const totalPay = summary.reduce((v, g) => v + g.pay, 0);

  const sumRow = (g: PersonalAttendanceSummary) => [g.name, g.company || "-", g.present, g.absent, g.early, g.out, g.paidDays.toFixed(1), won(g.pay)];
  const detailRow = (x: Attendance) => [
    x.date,
    x.workerName,
    x.company || "-",
    x.floor || "-",
    x.trade || "-",
    `${x.inTime || "-"} ~ ${x.outTime || "-"}`,
    x.status || "-",
    won(attendanceDailyWage(x, workers)),
    attendanceWageFactor(x.status).toFixed(1) + "일",
    won(attendancePay(x, workers)),
  ];

  const sumCols: Column<PersonalAttendanceSummary & { id: string }>[] = SUM_HEADS.map((h, i) => ({
    key: h,
    header: h,
    cell: (g) => (i === 0 ? <b>{g.name}</b> : <span className="whitespace-nowrap">{sumRow(g)[i]}</span>),
  }));
  const detailCols: Column<Attendance>[] = DETAIL_HEADS.map((h, i) => ({
    key: h,
    header: h,
    cell: (x) => <span className={i === 2 || i === 4 ? undefined : "whitespace-nowrap"}>{detailRow(x)[i]}</span>,
  }));

  const exportCSV = () => {
    if (!rows.length) return toast("다운로드할 출역기록이 없습니다.", "danger");
    downloadCSV(
      [
        ["날짜", "근로자", "소속업체", "층·구역", "공종", "출근시간", "퇴근시간", "출역상태", "기록시간(시간)", "1일 노임(원)", "적용일수", "당일 노무비(원)"],
        ...rows.map((x) => [
          x.date,
          x.workerName,
          x.company || "",
          x.floor || "",
          x.trade || "",
          x.inTime || "",
          x.outTime || "",
          x.status || "",
          attendanceHours(x).toFixed(1),
          attendanceDailyWage(x, workers),
          attendanceWageFactor(x.status),
          attendancePay(x, workers),
        ]),
      ],
      `개인별_출역집계_${today()}.csv`,
    );
  };

  const print = () => {
    const tbl = (heads: string[], body: unknown[][]) =>
      `<table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${
        body.length
          ? body.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")
          : `<tr><td colspan="${heads.length}" style="text-align:center">자료가 없습니다.</td></tr>`
      }</tbody></table>`;
    const filters = [
      `기간 ${start || "처음"} ~ ${end || "끝"}`,
      wid ? `근로자 ${workers.find((w) => w.id === wid)?.name ?? ""}` : "",
      comp ? `업체 ${comp}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    printHtml(
      "개인별 출역집계표",
      `<h2>개인별 출역집계표</h2><p class="sub">${esc(getSiteInfo().name)} · ${esc(filters)}</p>
<p class="note">${esc(WAGE_NOTE)}</p><p><b>조회기간 노무비 합계: ${esc(won(totalPay))}</b></p>
${tbl(SUM_HEADS, summary.map(sumRow))}<h4>개인별 상세 출역내역</h4>${tbl(DETAIL_HEADS, rows.map(detailRow))}`,
      "body{padding:20px}table{font-size:12px;margin:10px 0}th,td{padding:6px}h4{margin-top:18px}.note{font-size:12px;color:#555}",
    );
  };

  return (
    <Panel
      title="개인별 출역집계표"
      actions={
        <>
          <Button size="sm" onClick={exportCSV}>
            엑셀용 CSV 다운로드
          </Button>
          <Button size="sm" onClick={print}>
            인쇄 / PDF
          </Button>
        </>
      }
    >
      <FormGrid cols={4}>
        <Field label="조회 시작일">
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="조회 종료일">
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
        <Field label="근로자">
          <Select
            placeholder="전체 근로자"
            value={wid}
            onChange={(e) => setWorkerId(e.target.value)}
            options={workers.map((x) => ({ value: x.id, label: `${x.name} · ${x.company || "소속 미기재"}` }))}
          />
        </Field>
        <Field label="소속업체">
          <Select placeholder="전체 업체" value={comp} onChange={(e) => setCompany(e.target.value)} options={companies} />
        </Field>
      </FormGrid>
      <Notice className="mt-0">{WAGE_NOTE}</Notice>
      <p className="my-3 text-[15px] font-bold">조회기간 노무비 합계: {won(totalPay)}</p>
      <DataTable rows={summary.map((g) => ({ ...g, id: g.key }))} columns={sumCols} empty="조회된 출역기록이 없습니다." />
      <h4 className="mt-6 mb-2 text-sm font-semibold">개인별 상세 출역내역</h4>
      <DataTable rows={rows} columns={detailCols} empty="조회된 출역기록이 없습니다." />
    </Panel>
  );
}
