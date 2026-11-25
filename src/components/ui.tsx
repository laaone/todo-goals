"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import type { Progress } from "@/lib/progress";
import { useViewStore } from "@/lib/store";
import { addWeeks, formatWeekRange, getWeekStart } from "@/lib/week";

export * from "./styles";

type Tone = "light" | "parchment" | "dark";
const TONE: Record<Tone, string> = {
  light: "bg-canvas text-ink",
  parchment: "bg-parchment text-ink",
  dark: "bg-tile text-on-dark",
};

/** 화면 가로를 꽉 채우는 구역. 구역 사이 구분은 선이 아니라 바탕색 변화로 한다 */
export function Tile({
  tone = "light",
  className = "",
  children,
  ...rest
}: { tone?: Tone; className?: string; children: ReactNode } & HTMLAttributes<HTMLElement>) {
  return (
    <section className={`${TONE[tone]} ${className}`} {...rest}>
      <div className="mx-auto w-full max-w-[1080px] px-5 py-12 sm:px-8 sm:py-16">{children}</div>
    </section>
  );
}

/** 화면별 보조 바: 반투명 파치먼트 + 블러, 왼쪽 화면 이름, 오른쪽 주요 행동 */
export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="sticky top-11 z-20 border-b border-black/5 bg-parchment/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-[52px] max-w-[1080px] items-center justify-between gap-4 px-5 sm:px-8">
        <span className="headline text-[19px] text-ink sm:text-[21px]">{title}</span>
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </div>
  );
}

export function ProgressBar({
  progress,
  label,
  unit = "",
  onDark = false,
}: {
  progress: Progress;
  label?: string;
  /** 숫자 뒤에 붙일 단위 (예: "회") */
  unit?: string;
  onDark?: boolean;
}) {
  return (
    <div className="w-full">
      <div className={`mb-1.5 flex items-baseline justify-between gap-3 text-sm ${onDark ? "text-on-dark-muted" : "text-muted"}`}>
        <span>{label}</span>
        <span className="tabular-nums">
          <span className={`font-semibold ${onDark ? "text-on-dark" : "text-ink"}`}>{progress.percent}%</span>{" "}
          {progress.done}/{progress.total}
          {unit}
        </span>
      </div>
      <div
        className={`h-1.5 overflow-hidden rounded-full ${onDark ? "bg-white/15" : "bg-black/[0.07]"}`}
        role="progressbar"
        aria-label={label ?? "진행률"}
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${onDark ? "bg-primary-on-dark" : "bg-primary"}`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}

/** 원형 아이콘 버튼 (사진 위 컨트롤처럼 반투명 회색) */
export const circleBtn =
  "press flex size-9 items-center justify-center rounded-full bg-chip/60 text-ink hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus";

export function WeekNavigator({ align = "start" }: { align?: "start" | "center" }) {
  const viewWeek = useViewStore((s) => s.viewWeek);
  const setViewWeek = useViewStore((s) => s.setViewWeek);
  const isThisWeek = viewWeek === getWeekStart();
  return (
    <div className={`flex flex-wrap items-center gap-3 ${align === "center" ? "justify-center" : ""}`}>
      <button className={circleBtn} onClick={() => setViewWeek(addWeeks(viewWeek, -1))} aria-label="이전 주">
        <Chevron dir="left" />
      </button>
      <span className="min-w-36 text-center text-[19px] font-semibold tabular-nums text-ink">
        {formatWeekRange(viewWeek)}
      </span>
      <button className={circleBtn} onClick={() => setViewWeek(addWeeks(viewWeek, 1))} aria-label="다음 주">
        <Chevron dir="right" />
      </button>
      {!isThisWeek && (
        <button
          className="press rounded-full px-3 py-1 text-sm text-primary hover:underline underline-offset-4"
          onClick={() => setViewWeek(getWeekStart())}
        >
          이번 주로
        </button>
      )}
    </div>
  );
}

export function Chevron({ dir }: { dir: "left" | "right" }) {
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
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-card bg-canvas p-0 text-ink backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-6 pt-6">
        <h2 className="headline text-[21px]">{title}</h2>
        <button type="button" onClick={onClose} aria-label="닫기" className={circleBtn}>
          <svg viewBox="0 0 16 16" width="12" height="12" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
    <div className="mx-auto max-w-[1080px] space-y-4 px-5 py-16 sm:px-8" aria-busy="true" aria-label="불러오는 중">
      <div className="h-12 w-64 animate-pulse rounded-capsule bg-parchment" />
      <div className="h-56 animate-pulse rounded-card bg-parchment" />
    </div>
  );
}
