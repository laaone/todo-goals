export type Status = "todo" | "doing" | "done";
export type Priority = "high" | "medium" | "low";
/** 0 = 월요일 ... 6 = 일요일 */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const STATUSES: Status[] = ["todo", "doing", "done"];
export const MAX_WEEKLY_GOALS = 5;

/** 1년 목표 */
export interface Goal {
  id: string;
  title: string;
  description: string;
  year: number;
  createdAt: string;
}

/** 주 단위 계획. weekStart(그 주 월요일, YYYY-MM-DD)가 키 */
export interface WeeklyPlan {
  weekStart: string;
  memo: string;
  review: string;
}

/** 주간 목표 하나의 목표 횟수 범위 (하루 한 번 체크, 주 7일) */
export const MIN_WEEKLY_TARGET = 1;
export const MAX_WEEKLY_TARGET = 7;
export const DEFAULT_WEEKLY_TARGET = 3;

/** 이번 주 목표 (주당 최대 MAX_WEEKLY_GOALS개) */
export interface WeeklyGoal {
  id: string;
  weekStart: string;
  goalId: string | null;
  title: string;
  order: number;
  /** 목표 횟수 (1~7). 체크가 이 수에 닿으면 100% */
  target: number;
  /** 실행을 체크한 요일들 (하루 한 번, 오름차순) */
  checks: DayIndex[];
}

export interface Todo {
  id: string;
  title: string;
  description: string;
  status: Status;
  order: number;
  weekStart: string;
  day: DayIndex | null;
  weeklyGoalId: string | null;
  priority: Priority | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  version: 1;
  goals: Goal[];
  weeklyPlans: WeeklyPlan[];
  weeklyGoals: WeeklyGoal[];
  todos: Todo[];
}
