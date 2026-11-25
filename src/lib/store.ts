"use client";

import { create } from "zustand";
import { emptyData } from "./data";
import { diffData, isEmptyData, isEmptyPayload } from "./sync";
import type { AppData } from "./types";

/** 예전 버전(localStorage 저장)이 쓰던 키. 처음 한 번 서버로 옮긴 뒤 지운다 */
export const LEGACY_STORAGE_KEY = "todo-app:v1";
const SAVE_DELAY_MS = 400;

type LoadState = "loading" | "ready" | "error";
type SaveState = "saved" | "pending" | "saving" | "error";

interface AppState {
  data: AppData;
  loadState: LoadState;
  saveState: SaveState;
  /** 데이터 변경. 화면은 즉시 바뀌고 서버 저장은 잠시 뒤 모아서 한다 */
  apply: (fn: (data: AppData) => AppData) => void;
  load: () => Promise<void>;
  /** 미뤄 둔 저장을 바로 보낸다 (재시도 버튼, 페이지 이탈 시) */
  flush: (opts?: { keepalive?: boolean }) => Promise<void>;
}

/** 서버가 마지막으로 저장을 확인한 데이터. 다음 저장은 이것과의 차이만 보낸다 */
let confirmed: AppData = emptyData();
let timer: ReturnType<typeof setTimeout> | undefined;
let sending = false;

export const useAppStore = create<AppState>()((set, get) => ({
  data: emptyData(),
  loadState: "loading",
  saveState: "saved",

  apply: (fn) => {
    set((s) => ({ data: fn(s.data) }));
    if (get().saveState !== "saving") set({ saveState: "pending" });
    clearTimeout(timer);
    timer = setTimeout(() => void get().flush(), SAVE_DELAY_MS);
  },

  load: async () => {
    set({ loadState: "loading" });
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      if (res.status === 401) return goToLogin();
      if (!res.ok) throw new Error(`GET /api/data ${res.status}`);
      const server = (await res.json()) as AppData;
      confirmed = server;

      const legacy = readLegacy();
      if (legacy && isEmptyData(server) && !isEmptyData(legacy)) {
        // 서버가 비어 있고 이 브라우저에 예전 데이터가 있으면 옮긴다
        set({ data: legacy, loadState: "ready" });
        await get().flush();
        if (get().saveState === "saved") removeLegacy();
      } else {
        set({ data: server, loadState: "ready" });
        if (legacy) removeLegacy();
      }
    } catch (error) {
      console.error(error);
      set({ loadState: "error" });
    }
  },

  flush: async ({ keepalive = false } = {}) => {
    clearTimeout(timer);
    if (sending) {
      // 보내는 중이면 끝난 뒤 다시 확인한다 (요청 순서 보장)
      timer = setTimeout(() => void get().flush(), SAVE_DELAY_MS);
      return;
    }
    const next = get().data;
    const payload = diffData(confirmed, next);
    if (isEmptyPayload(payload)) {
      set({ saveState: "saved" });
      return;
    }

    sending = true;
    set({ saveState: "saving" });
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive,
      });
      if (res.status === 401) {
        set({ saveState: "error" });
        return goToLogin();
      }
      if (!res.ok) throw new Error(`POST /api/sync ${res.status}`);
      confirmed = next;
      set({ saveState: get().data === next ? "saved" : "pending" });
    } catch (error) {
      // confirmed는 그대로라 다음 저장 때 실패분까지 다시 보낸다
      console.error(error);
      set({ saveState: "error" });
    } finally {
      sending = false;
    }
    if (get().saveState === "pending") void get().flush();
  },
}));

/** 데이터를 다 불러왔는지. 그 전엔 화면에 스켈레톤을 보여준다 */
export function useHydrated(): boolean {
  return useAppStore((s) => s.loadState === "ready");
}

interface ViewState {
  /** 대시보드와 주간 계획 화면이 함께 보는 주. 마운트 후 DataLoader가 채운다 */
  viewWeek: string;
  setViewWeek: (weekStart: string) => void;
}

/** 저장하지 않는 화면 상태 */
export const useViewStore = create<ViewState>()((set) => ({
  viewWeek: "",
  setViewWeek: (viewWeek) => set({ viewWeek }),
}));

/**
 * 세션이 없거나 만료됨 → 로그인 화면으로.
 * 스토어는 React 밖이라 router를 쓸 수 없고, 남은 상태를 버리려고 일부러 전체 페이지 이동을 한다.
 */
function goToLogin() {
  window.location.assign(new URL("/login", window.location.origin));
}

function readLegacy(): AppData | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { data?: AppData } };
    return parsed.state?.data ?? null;
  } catch {
    return null;
  }
}

function removeLegacy() {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* 저장소 접근이 막힌 환경이면 무시 */
  }
}
