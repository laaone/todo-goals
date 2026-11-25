"use client";

import { useAppStore } from "@/lib/store";

/** 검정 상단 바 위의 불러오기/저장 상태. 평소 상태는 좁은 화면에서 숨기고, 오류는 항상 보인다 */
export function SyncStatus() {
  const loadState = useAppStore((s) => s.loadState);
  const saveState = useAppStore((s) => s.saveState);
  const load = useAppStore((s) => s.load);
  const flush = useAppStore((s) => s.flush);

  const retry = "ml-1 text-primary-on-dark underline-offset-4 hover:underline";
  const quiet = "hidden text-xs text-on-dark/60 md:inline";

  if (loadState === "error")
    return (
      <span role="alert" className="text-xs text-danger-on-dark">
        불러오기 실패
        <button className={retry} onClick={() => void load()}>
          다시 시도
        </button>
      </span>
    );
  if (loadState === "loading") return <span className={quiet}>불러오는 중…</span>;

  if (saveState === "error")
    return (
      <span role="alert" className="text-xs text-danger-on-dark">
        저장 실패
        <button className={retry} onClick={() => void flush()}>
          다시 시도
        </button>
      </span>
    );
  return (
    <span className={quiet} aria-live="polite">
      {saveState === "saved" ? "저장됨" : "저장 중…"}
    </span>
  );
}
