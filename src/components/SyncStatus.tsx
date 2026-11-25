"use client";

import { useAppStore } from "@/lib/store";

/** 불러오기/저장 상태 표시와 재시도 버튼 */
export function SyncStatus() {
  const loadState = useAppStore((s) => s.loadState);
  const saveState = useAppStore((s) => s.saveState);
  const load = useAppStore((s) => s.load);
  const flush = useAppStore((s) => s.flush);

  const retry = "ml-1 underline hover:no-underline";

  if (loadState === "error")
    return (
      <span role="alert" className="text-xs text-red-600">
        불러오기 실패
        <button className={retry} onClick={() => void load()}>
          다시 시도
        </button>
      </span>
    );
  if (loadState === "loading") return <span className="text-xs text-zinc-400">불러오는 중…</span>;

  if (saveState === "error")
    return (
      <span role="alert" className="text-xs text-red-600">
        저장 실패
        <button className={retry} onClick={() => void flush()}>
          다시 시도
        </button>
      </span>
    );
  return (
    <span className="text-xs text-zinc-400" aria-live="polite">
      {saveState === "saved" ? "저장됨" : "저장 중…"}
    </span>
  );
}
