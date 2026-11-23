/** 현장 만들기·전환·완료 표시·삭제 (현장 목록·정보는 DB, 지금 현장 id 는 로컬스토리지) */
import { confirmDelete, confirmDialog, toast } from "@/components/ui";
import { DEFAULT_FLOORS, TRADE_CATALOG } from "@/constants/masters";
import { getSites, reloadSites } from "@/lib/site-store";
import { getMasters } from "@/lib/storage/masters";
import { getCurrentSiteId, read, setCurrentSiteId, sitePrefix, writeRawKey } from "@/lib/storage/store";
import {
  createSite as createSiteAction,
  deleteSite as deleteSiteAction,
  setSiteStatus,
  type SiteDTO,
  type SiteInput,
} from "@/server/actions/sites";
import { removeSiteData } from "./registry";

export const siteNameOf = (id: string) => getSites().find((s) => s.id === id)?.name ?? "현장";

export interface NewSiteInput {
  info: SiteInput;
  /** 지금 현장의 층·공종 목록 가져오기 (아직 DB 로 옮기기 전이라 로컬스토리지 복사) */
  copyMasters: boolean;
  /** 지금 현장의 재직 근로자 가져오기 (아직 DB 로 옮기기 전이라 로컬스토리지 복사) */
  copyWorkers: boolean;
}

/** 새 현장을 DB 에 만들고 그 현장으로 전환. 만든 id (취소·실패 시 null) */
export async function createSite(input: NewSiteInput): Promise<string | null> {
  const name = input.info.name.trim();
  if (
    getSites().some((s) => s.name === name) &&
    !(await confirmDialog({
      title: "같은 이름의 현장이 있습니다",
      message: `"${name}" 이름의 현장이 이미 있습니다. 그래도 만들까요?`,
      confirmText: "만들기",
    }))
  )
    return null;

  const r = await createSiteAction(input.info);
  if (!r.ok) {
    toast(r.error, "danger");
    return null;
  }

  // 아직 로컬스토리지에 있는 현장별 목록 초기값 (해당 기능을 DB 로 옮기면 서버에서 처리)
  const p = sitePrefix(r.id);
  if (input.copyMasters) {
    const { floors, trades } = getMasters();
    writeRawKey(p + "masterFloors", floors);
    writeRawKey(p + "masterTrades", trades);
  } else {
    writeRawKey(p + "masterFloors", DEFAULT_FLOORS);
    writeRawKey(p + "masterTrades", TRADE_CATALOG.flatMap((g) => g[1]));
  }
  localStorage.setItem("ui_tradeCatalog_" + r.id, "2");
  if (input.copyWorkers)
    writeRawKey(
      p + "workers",
      read<{ status?: string }>("workers").filter((w) => w.status !== "퇴사·출역종료"),
    );

  setCurrentSiteId(r.id);
  await reloadSites();
  return r.id;
}

/** 다른 현장으로 전환 (확인 후 true) */
export async function switchSite(id: string): Promise<boolean> {
  if (id === getCurrentSiteId()) return false;
  if (
    !(await confirmDialog({
      title: `"${siteNameOf(id)}" 현장으로 바꿀까요?`,
      message: "화면에 그 현장 자료만 보이게 됩니다.",
      confirmText: "바꾸기",
    }))
  )
    return false;
  setCurrentSiteId(id);
  return true;
}

/** 진행 중 ↔ 완료 */
export async function toggleSiteDone(site: SiteDTO) {
  const r = await setSiteStatus(site.id, site.status === "done" ? "active" : "done");
  if (!r.ok) return toast(r.error, "danger");
  await reloadSites();
}

/** 현장 삭제 (지금 현장은 삭제 불가) */
export async function deleteSite(id: string): Promise<boolean> {
  if (id === getCurrentSiteId()) return false;
  const nm = siteNameOf(id);
  if (!(await confirmDelete(`"${nm}" 현장이 목록에서 사라집니다.`, "현장을 삭제할까요?"))) return false;
  const r = await deleteSiteAction(id);
  if (!r.ok) {
    toast(r.error, "danger");
    return false;
  }
  removeSiteData(id); // 이 브라우저에 남은 그 현장 자료 정리
  await reloadSites();
  return true;
}
