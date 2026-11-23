import type { BulkEditConfig, FieldSpec } from "@/components/data";
import { read } from "@/lib/storage/store";
import { deleteWorkerFiles } from "./files";
import { ATTENDANCE_STATUSES_BULK, WORKER_STATUSES, type Attendance, type Worker } from "./types";

/** 원본 BE_CFG.workerTable */
export const WORKER_BULK_EDIT: BulkEditConfig<Worker> = {
  collection: "workers",
  entityName: "근로자",
  fields: [
    { key: "company", label: "소속업체", type: "company" },
    { key: "trade", label: "직종·공종", type: "trade" },
    { key: "dailyWage", label: "1일 노임", type: "number" },
    { key: "status", label: "등록 상태", type: "opts", options: [...WORKER_STATUSES] },
  ],
  canDelete: (ids) => {
    const att = read<Attendance>("attendance");
    const used = ids.filter((id) => att.some((x) => x.workerId === id));
    return used.length
      ? `출역기록이 있는 ${used.length}명은 삭제할 수 없습니다. 등록 상태를 '퇴사·출역종료'로 바꿔 주세요.`
      : undefined;
  },
  afterDelete: deleteWorkerFiles,
};

/** 원본 BE_CFG.attendanceTable */
export const ATTENDANCE_BULK_EDIT: BulkEditConfig<Attendance> = {
  collection: "attendance",
  entityName: "출역기록",
  fields: [
    { key: "status", label: "출역상태", type: "opts", options: [...ATTENDANCE_STATUSES_BULK] },
    { key: "inTime", label: "출근시간", type: "time" },
    { key: "outTime", label: "퇴근시간", type: "time" },
    { key: "floor", label: "층·구역", type: "floor" },
    { key: "trade", label: "공종", type: "trade" },
    { key: "date", label: "출역일자", type: "date" },
  ],
};

/** 원본 BULK.wk */
export const WORKER_BULK_COLUMNS: FieldSpec[] = [
  { key: "name", label: "성명", type: "text", placeholder: "성명" },
  { key: "company", label: "소속업체", type: "company" },
  { key: "trade", label: "공종", type: "trade" },
  { key: "phone", label: "연락처", type: "text", placeholder: "010-0000-0000" },
  { key: "dailyWage", label: "1일 노임", type: "wage", width: 110 },
];
export const WORKER_BULK_CARRY = ["company", "trade", "dailyWage"];
