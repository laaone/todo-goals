import type { AppData, Todo } from "./types";

export interface Progress {
  done: number;
  total: number;
  /** 0~100 정수. 할 일이 없으면 0 */
  percent: number;
}

export function progressOf(todos: Todo[]): Progress {
  const total = todos.length;
  const done = todos.filter((t) => t.status === "done").length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

/** 주간 진행률: 그 주의 모든 할 일 기준 */
export function weekProgress(data: AppData, weekStart: string): Progress {
  return progressOf(data.todos.filter((t) => t.weekStart === weekStart));
}

/** 주간 목표 진행률: 그 주간 목표에 연결된 할 일 기준 */
export function weeklyGoalProgress(data: AppData, weeklyGoalId: string): Progress {
  return progressOf(data.todos.filter((t) => t.weeklyGoalId === weeklyGoalId));
}

/** 1년 목표 진행률: 그 목표에 연결된 모든 주간 목표의 할 일 기준 */
export function goalProgress(data: AppData, goalId: string): Progress {
  const wgIds = new Set(
    data.weeklyGoals.filter((w) => w.goalId === goalId).map((w) => w.id),
  );
  return progressOf(data.todos.filter((t) => t.weeklyGoalId && wgIds.has(t.weeklyGoalId)));
}
