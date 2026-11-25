"use client";

import { toggleWeeklyGoalCheck } from "@/lib/data";
import { checkProgress } from "@/lib/progress";
import { useAppStore } from "@/lib/store";
import { MAX_WEEKLY_TARGET, MIN_WEEKLY_TARGET, type DayIndex, type Goal, type WeeklyGoal } from "@/lib/types";
import { DAY_LABELS, dateOfDay, toISODate, todayISO } from "@/lib/week";
import { ProgressBar } from "./ui";

const DAYS: DayIndex[] = [0, 1, 2, 3, 4, 5, 6];

/** 요일별 실행 체크 (하루 한 번). 체크한 날은 파랑, 오늘은 파란 테두리 */
export function DayChecks({ wg, size = "md" }: { wg: WeeklyGoal; size?: "sm" | "md" }) {
  const apply = useAppStore((s) => s.apply);
  const today = todayISO();
  // sm: 좁은 카드에서도 7개가 한 줄에 들어가는 크기
  const dim = size === "sm" ? "size-8 text-[13px]" : "size-9 text-[15px] sm:size-10";
  return (
    <div className={`flex flex-wrap ${size === "sm" ? "gap-1" : "gap-1 sm:gap-1.5"}`} role="group" aria-label={`${wg.title} 실행 체크`}>
      {DAYS.map((d) => {
        const date = dateOfDay(wg.weekStart, d);
        const on = wg.checks.includes(d);
        const isToday = toISODate(date) === today;
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            aria-label={`${DAY_LABELS[d]}요일 ${date.getMonth() + 1}월 ${date.getDate()}일 실행 체크`}
            title={`${date.getMonth() + 1}/${date.getDate()} (${DAY_LABELS[d]})`}
            onClick={() => apply((data) => toggleWeeklyGoalCheck(data, wg.id, d))}
            className={`press flex ${dim} shrink-0 items-center justify-center rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus ${
              on
                ? "bg-primary text-on-primary"
                : `bg-canvas text-ink ${isToday ? "border-2 border-primary" : "border border-black/10"} hover:border-primary`
            }`}
          >
            {on ? (
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              DAY_LABELS[d]
            )}
          </button>
        );
      })}
    </div>
  );
}

/** 목표 횟수 조절 (− 3회 +) */
export function TargetStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const btn =
    "press flex size-8 items-center justify-center rounded-full text-lg text-primary disabled:text-muted-48 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary-focus";
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-canvas px-1 py-1" role="group" aria-label="목표 횟수">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= MIN_WEEKLY_TARGET} aria-label="목표 횟수 줄이기">
        −
      </button>
      <span className="min-w-14 text-center text-[15px] font-semibold tabular-nums text-ink" aria-live="polite">
        주 {value}회
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= MAX_WEEKLY_TARGET} aria-label="목표 횟수 늘리기">
        +
      </button>
    </div>
  );
}

/** 대시보드용 주간 목표 카드: 제목, 연결된 1년 목표, 체크, 달성률 */
export function WeeklyGoalCard({ wg, goal }: { wg: WeeklyGoal; goal: Goal | null }) {
  return (
    <li className="flex flex-col gap-4 rounded-card bg-canvas p-6" data-testid="weekly-goal-card">
      <div>
        <p className="text-[17px] font-semibold text-ink">{wg.title}</p>
        <p className="text-sm text-muted">
          주 {wg.target}회 · {goal ? goal.title : "1년 목표 연결 없음"}
        </p>
      </div>
      <DayChecks wg={wg} size="sm" />
      <ProgressBar progress={checkProgress(wg)} label="달성" unit="회" />
    </li>
  );
}
