"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Progress } from "@/lib/progress";
import { useViewStore } from "@/lib/store";
import { addWeeks, formatWeekRange, getWeekStart } from "@/lib/week";

export * from "./styles";
import { textBtn } from "./styles";

export function ProgressBar({ progress, label }: { progress: Progress; label?: string }) {
  return (
    <div className="w-full">
      <div className="mb-1.5 flex justify-between text-sm text-muted">
        <span>{label}</span>
        <span className="tabular-nums">
          <span className="font-semibold text-ink">{progress.percent}%</span> ({progress.done}/{progress.total})
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-hairline-soft"
        role="progressbar"
        aria-label={label ?? "진행률"}
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-ink transition-[width]" style={{ width: `${progress.percent}%` }} />
      </div>
    </div>
  );
}

/** 이전/다음 주: 원형 아이콘 버튼 */
export function WeekNavigator() {
  const viewWeek = useViewStore((s) => s.viewWeek);
  const setViewWeek = useViewStore((s) => s.setViewWeek);
  const isThisWeek = viewWeek === getWeekStart();
  const circle =
    "flex size-9 items-center justify-center rounded-full bg-surface-strong text-ink transition-colors hover:bg-hairline";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className={circle} onClick={() => setViewWeek(addWeeks(viewWeek, -1))} aria-label="이전 주">
        <Chevron dir="left" />
      </button>
      <span className="min-w-32 text-center text-lg font-semibold text-ink tabular-nums">
        {formatWeekRange(viewWeek)}
        {isThisWeek && <span className="ml-2 text-sm font-medium text-muted">이번 주</span>}
      </span>
      <button className={circle} onClick={() => setViewWeek(addWeeks(viewWeek, 1))} aria-label="다음 주">
        <Chevron dir="right" />
      </button>
      {!isThisWeek && (
        <button className={textBtn} onClick={() => setViewWeek(getWeekStart())}>
          이번 주로
        </button>
      )}
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d={dir === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-card bg-canvas p-0 text-ink shadow-float backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex size-8 items-center justify-center rounded-full text-ink hover:bg-surface-strong"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 3l10 10M13 3 3 13" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}

export function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="불러오는 중">
      <div className="h-9 w-56 animate-pulse rounded-btn bg-surface-strong" />
      <div className="h-48 animate-pulse rounded-card bg-surface-strong" />
    </div>
  );
}
