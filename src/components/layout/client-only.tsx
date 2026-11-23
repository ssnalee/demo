"use client";

import { Button } from "@/components/ui";
import { SiteNewModal } from "@/features/site";
import { useSites } from "@/lib/site-store";
import { useState, useSyncExternalStore, type ReactNode } from "react";

const noop = () => () => {};

function Loading({ text = "불러오는 중…" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-24 text-sm text-sub">
      <span className="size-4 animate-spin rounded-full border-2 border-line border-t-brand" aria-hidden />
      {text}
    </div>
  );
}

/**
 * 화면 본문은 브라우저에서만 렌더링 (+ 현장 목록을 DB 에서 받은 뒤).
 * 레이아웃이 아닌 각 page 세그먼트 안에서 사용해야 Next.js가 세그먼트를 검증할 수 있음.
 * requireSite=false: 현장과 무관한 화면 (계정 관리 등)
 */
export function ClientOnly({ children, requireSite = true }: { children: ReactNode; requireSite?: boolean }) {
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  if (!isClient) return <Loading />;
  return requireSite ? <SiteGate>{children}</SiteGate> : <div className="animate-fade-in">{children}</div>;
}

function SiteGate({ children }: { children: ReactNode }) {
  const { sites, error } = useSites();
  const [newOpen, setNewOpen] = useState(false);
  if (sites === undefined) return <Loading text="현장 정보를 불러오는 중…" />;
  if (!sites.length)
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <h2 className="text-[20px] font-bold tracking-[-0.03em]">{error ? "현장 목록을 불러오지 못했습니다" : "첫 현장을 만들어 주세요"}</h2>
        <p className="text-[13.5px] text-sub">
          {error ?? "현장을 만들면 공정표·작업일보 등 모든 기록을 그 현장 기준으로 관리합니다."}
        </p>
        {!error && (
          <Button variant="primary" className="mt-2" onClick={() => setNewOpen(true)}>
            + 새 현장 만들기
          </Button>
        )}
        <SiteNewModal open={newOpen} onClose={() => setNewOpen(false)} />
      </div>
    );
  return <div className="animate-fade-in">{children}</div>;
}
