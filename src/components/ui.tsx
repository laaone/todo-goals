"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Progress } from "@/lib/progress";
import { useViewStore } from "@/lib/store";
import { addWeeks, formatWeekRange, getWeekStart } from "@/lib/week";

export function ProgressBar({ progress, label }: { progress: Progress; label?: string }) {
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span>
          {progress.percent}% ({progress.done}/{progress.total})
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-zinc-200"
        role="progressbar"
        aria-label={label ?? "진행률"}
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width]"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}

export function WeekNavigator() {
  const viewWeek = useViewStore((s) => s.viewWeek);
  const setViewWeek = useViewStore((s) => s.setViewWeek);
  const isThisWeek = viewWeek === getWeekStart();
  const btn = "rounded-md border border-zinc-300 px-2.5 py-1 text-sm hover:bg-zinc-100";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className={btn} onClick={() => setViewWeek(addWeeks(viewWeek, -1))} aria-label="이전 주">
        ◀
      </button>
      <span className="min-w-28 text-center font-semibold">
        {formatWeekRange(viewWeek)}
        {isThisWeek && <span className="ml-1 text-xs font-normal text-emerald-600">이번 주</span>}
      </span>
      <button className={btn} onClick={() => setViewWeek(addWeeks(viewWeek, 1))} aria-label="다음 주">
        ▶
      </button>
      {!isThisWeek && (
        <button className={btn} onClick={() => setViewWeek(getWeekStart())}>
          오늘
        </button>
      )}
    </div>
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
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl p-0 backdrop:bg-black/40"
    >
      <div className="p-5">
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}

export function Skeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="불러오는 중">
      <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
      <div className="h-40 animate-pulse rounded bg-zinc-200" />
    </div>
  );
}

export const inputCls =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none";
export const primaryBtn =
  "rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40";
export const ghostBtn = "rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100";
