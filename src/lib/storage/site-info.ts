import type { SiteDTO } from "@/server/actions/sites";
import { getCurrentSite } from "../site-store";

export interface SiteInfo {
  name: string;
  type?: string;
  manager?: string;
  basement?: string;
  above?: string;
  start?: string;
  end?: string;
  address?: string;
}

/** DB 현장 → 화면·출력용 현장 정보 */
export const toSiteInfo = (s: SiteDTO): SiteInfo => ({
  name: s.name,
  type: s.constructionType ?? "",
  manager: s.managerName ?? "",
  basement: String(s.basementFloors),
  above: s.aboveFloors ? String(s.aboveFloors) : "",
  start: s.startDate ?? "",
  end: s.endDate ?? "",
  address: s.address ?? "",
});

/** 지금 현장 정보 (출력물 머리글 등). 현장이 없으면 기본 이름 */
export function getSiteInfo(): SiteInfo {
  const s = getCurrentSite();
  return s ? toSiteInfo(s) : { name: "현장 안전관리" };
}

/** 공사 개요 한 줄 (원본과 동일). 정보가 없으면 빈 문자열 */
export function siteSummaryText(s: SiteInfo): string {
  const scale = [s.basement && s.basement !== "0" ? `지하 ${s.basement}층` : "", s.above ? `지상 ${s.above}층` : ""]
    .filter(Boolean)
    .join(" / ");
  return [s.type, scale, s.start || s.end ? `${s.start || ""} ~ ${s.end || ""}` : "", s.manager ? `소장 ${s.manager}` : ""]
    .filter(Boolean)
    .join(" · ");
}
