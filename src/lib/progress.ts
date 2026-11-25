import type { AppData, Todo, WeeklyGoal } from "./types";
import { dateOfDay, toISODate } from "./week";

export interface Progress {
  done: number;
  total: number;
  /** 0~100 정수. total이 0이면 0 */
  percent: number;
}

const pct = (done: number, total: number) => (total ? Math.min(100, Math.round((done / total) * 100)) : 0);

export function progressOf(todos: Todo[]): Progress {
  const total = todos.length;
  const done = todos.filter((t) => t.status === "done").length;
  return { done, total, percent: pct(done, total) };
}

/** 할 일 진행률: 그 주의 모든 할 일 중 완료 비율 */
export function weekProgress(data: AppData, weekStart: string): Progress {
  return progressOf(data.todos.filter((t) => t.weekStart === weekStart));
}

/** 주간 목표 달성률: 체크 수 / 목표 횟수 (넘쳐도 100%) */
export function checkProgress(wg: WeeklyGoal): Progress {
  return { done: wg.checks.length, total: wg.target, percent: pct(wg.checks.length, wg.target) };
}

/** 주간 목표 전체 달성률: 목표별로 목표 횟수까지만 센 체크 합 / 목표 횟수 합 */
export function weeklyGoalsProgress(goals: WeeklyGoal[]): Progress {
  const total = goals.reduce((s, w) => s + w.target, 0);
  const done = goals.reduce((s, w) => s + Math.min(w.checks.length, w.target), 0);
  return { done, total, percent: pct(done, total) };
}

export interface WeekActivity {
  weekStart: string;
  /** 그 주 연결된 주간 목표들의 체크 합(목표 횟수까지만) / 목표 횟수 합 */
  progress: Progress;
}

export interface GoalActivity {
  /** 날짜(YYYY-MM-DD) → 그날 체크 수 (연결된 주간 목표가 여럿이면 2 이상) */
  days: Map<string, number>;
  /** 주간 목표가 있었던 주, 오래된 순 */
  weeks: WeekActivity[];
  totalChecks: number;
  /** 100% 달성한 주 수 */
  achievedWeeks: number;
}

/** 1년 목표에 연결된 주간 목표들의 실행 기록 (그 해에 속한 날짜만) */
export function goalActivity(data: AppData, goalId: string, year: number): GoalActivity {
  const linked = data.weeklyGoals.filter((w) => w.goalId === goalId);
  const days = new Map<string, number>();
  const byWeek = new Map<string, WeeklyGoal[]>();

  for (const w of linked) {
    for (const d of w.checks) {
      const date = dateOfDay(w.weekStart, d);
      if (date.getFullYear() !== year) continue;
      const key = toISODate(date);
      days.set(key, (days.get(key) ?? 0) + 1);
    }
    // 주의 일부라도 그 해에 걸치면 그 해의 주로 본다
    if (dateOfDay(w.weekStart, 0).getFullYear() === year || dateOfDay(w.weekStart, 6).getFullYear() === year) {
      byWeek.set(w.weekStart, [...(byWeek.get(w.weekStart) ?? []), w]);
    }
  }

  const weeks = [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, goals]) => ({ weekStart, progress: weeklyGoalsProgress(goals) }));

  return {
    days,
    weeks,
    totalChecks: [...days.values()].reduce((s, n) => s + n, 0),
    achievedWeeks: weeks.filter((w) => w.progress.percent === 100).length,
  };
}
