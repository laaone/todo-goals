"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAppStore, useViewStore } from "@/lib/store";
import { getWeekStart } from "@/lib/week";

/**
 * 마운트 후 서버에서 데이터를 불러오고, 보는 주를 클라이언트 시간 기준으로 맞춘다.
 * 페이지를 떠나거나 탭을 숨기면 미뤄 둔 저장을 바로 보낸다.
 * 로그인 화면에서는 불러오지 않는다 (401 → /login 무한 이동 방지).
 */
export function StoreHydrator() {
  const isLogin = usePathname() === "/login";

  useEffect(() => {
    if (isLogin) return;
    useViewStore.getState().setViewWeek(getWeekStart());
    if (useAppStore.getState().loadState !== "ready") void useAppStore.getState().load();

    const onHide = () => {
      if (document.visibilityState === "hidden") void useAppStore.getState().flush({ keepalive: true });
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [isLogin]);
  return null;
}
