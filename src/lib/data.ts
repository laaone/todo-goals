/**
 * AppData를 다루는 순수 함수 모음. 항상 새 객체를 반환하고 입력은 바꾸지 않는다.
 * 스토어(store.ts)는 이 함수들을 apply()로 호출만 한다.
 */
import {
  DEFAULT_WEEKLY_TARGET,
  MAX_WEEKLY_GOALS,
  MAX_WEEKLY_TARGET,
  MIN_WEEKLY_TARGET,
  type AppData,
  type DayIndex,
  type Goal,
  type Priority,
  type Status,
  type Todo,
  type WeeklyGoal,
  type WeeklyPlan,
} from "./types";

const newId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export function emptyData(): AppData {
  return { version: 1, goals: [], weeklyPlans: [], weeklyGoals: [], todos: [] };
}

export const clampTarget = (n: number) =>
  Math.min(MAX_WEEKLY_TARGET, Math.max(MIN_WEEKLY_TARGET, Math.round(Number.isFinite(n) ? n : MIN_WEEKLY_TARGET)));

const isDay = (v: unknown): v is DayIndex => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 6;

/**
 * 예전 형식 데이터를 현재 형식으로 맞춘다. 목표 횟수가 생기기 전의 주간 목표는 1회 목표, 체크 없음.
 * 이미 맞는 항목은 참조를 그대로 둔다 (sync.ts의 diff가 참조 비교에 기대므로).
 */
export function normalizeData(data: AppData): AppData {
  let changed = false;
  const weeklyGoals = data.weeklyGoals.map((w) => {
    const raw = w as Partial<WeeklyGoal> & WeeklyGoal;
    const ok =
      Number.isInteger(raw.target) &&
      raw.target >= MIN_WEEKLY_TARGET &&
      raw.target <= MAX_WEEKLY_TARGET &&
      Array.isArray(raw.checks);
    if (ok) return w;
    changed = true;
    const checks = Array.isArray(raw.checks) ? [...new Set(raw.checks.filter(isDay))].sort() : [];
    return { ...w, target: clampTarget(raw.target ?? MIN_WEEKLY_TARGET), checks };
  });
  return changed ? { ...data, weeklyGoals } : data;
}

/* ───────── 1년 목표 ───────── */

export function addGoal(
  data: AppData,
  input: { title: string; description?: string; year: number },
): AppData {
  const goal: Goal = {
    id: newId(),
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    year: input.year,
    createdAt: now(),
  };
  return { ...data, goals: [...data.goals, goal] };
}

export function updateGoal(
  data: AppData,
  id: string,
  patch: Partial<Pick<Goal, "title" | "description" | "year">>,
): AppData {
  return { ...data, goals: data.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) };
}

/** 목표 삭제 시 주간 목표는 남기고 연결만 해제 */
export function deleteGoal(data: AppData, id: string): AppData {
  return {
    ...data,
    goals: data.goals.filter((g) => g.id !== id),
    weeklyGoals: data.weeklyGoals.map((w) => (w.goalId === id ? { ...w, goalId: null } : w)),
  };
}

/* ───────── 주간 계획 ───────── */

export function getWeeklyPlan(data: AppData, weekStart: string): WeeklyPlan {
  return (
    data.weeklyPlans.find((p) => p.weekStart === weekStart) ?? { weekStart, memo: "", review: "" }
  );
}

export function updateWeeklyPlan(
  data: AppData,
  weekStart: string,
  patch: Partial<Pick<WeeklyPlan, "memo" | "review">>,
): AppData {
  const next = { ...getWeeklyPlan(data, weekStart), ...patch };
  const exists = data.weeklyPlans.some((p) => p.weekStart === weekStart);
  return {
    ...data,
    weeklyPlans: exists
      ? data.weeklyPlans.map((p) => (p.weekStart === weekStart ? next : p))
      : [...data.weeklyPlans, next],
  };
}

export function weeklyGoalsOf(data: AppData, weekStart: string): WeeklyGoal[] {
  return data.weeklyGoals
    .filter((w) => w.weekStart === weekStart)
    .sort((a, b) => a.order - b.order);
}

export function canAddWeeklyGoal(data: AppData, weekStart: string): boolean {
  return weeklyGoalsOf(data, weekStart).length < MAX_WEEKLY_GOALS;
}

/** 주당 최대 개수를 넘으면 data를 그대로 반환 */
export function addWeeklyGoal(
  data: AppData,
  input: { weekStart: string; title: string; goalId: string | null; target?: number },
): AppData {
  if (!canAddWeeklyGoal(data, input.weekStart)) return data;
  const existing = weeklyGoalsOf(data, input.weekStart);
  const wg: WeeklyGoal = {
    id: newId(),
    weekStart: input.weekStart,
    goalId: input.goalId,
    title: input.title.trim(),
    order: existing.length ? existing[existing.length - 1].order + 1 : 0,
    target: clampTarget(input.target ?? DEFAULT_WEEKLY_TARGET),
    checks: [],
  };
  return { ...data, weeklyGoals: [...data.weeklyGoals, wg] };
}

export function updateWeeklyGoal(
  data: AppData,
  id: string,
  patch: Partial<Pick<WeeklyGoal, "title" | "goalId" | "target">>,
): AppData {
  const fixed = patch.target === undefined ? patch : { ...patch, target: clampTarget(patch.target) };
  return {
    ...data,
    weeklyGoals: data.weeklyGoals.map((w) => (w.id === id ? { ...w, ...fixed } : w)),
  };
}

/** 그 요일의 실행 체크를 켜고 끈다 (하루 한 번). 목표 횟수를 넘겨 체크해도 기록은 남는다 */
export function toggleWeeklyGoalCheck(data: AppData, id: string, day: DayIndex): AppData {
  return {
    ...data,
    weeklyGoals: data.weeklyGoals.map((w) => {
      if (w.id !== id) return w;
      const checks = w.checks.includes(day)
        ? w.checks.filter((d) => d !== day)
        : ([...w.checks, day].sort() as DayIndex[]);
      return { ...w, checks };
    }),
  };
}

/** 주간 목표 삭제 시 할 일은 남기고 연결만 해제 */
export function deleteWeeklyGoal(data: AppData, id: string): AppData {
  return {
    ...data,
    weeklyGoals: data.weeklyGoals.filter((w) => w.id !== id),
    todos: data.todos.map((t) => (t.weeklyGoalId === id ? { ...t, weeklyGoalId: null } : t)),
  };
}

/* ───────── 할 일 ───────── */

export interface TodoInput {
  title: string;
  description?: string;
  weekStart: string;
  day?: DayIndex | null;
  weeklyGoalId?: string | null;
  priority?: Priority | null;
  dueDate?: string | null;
  status?: Status;
}

function columnOf(data: AppData, weekStart: string, status: Status): Todo[] {
  return data.todos
    .filter((t) => t.weekStart === weekStart && t.status === status)
    .sort((a, b) => a.order - b.order);
}

export function addTodo(data: AppData, input: TodoInput): AppData {
  const status = input.status ?? "todo";
  const col = columnOf(data, input.weekStart, status);
  const ts = now();
  const todo: Todo = {
    id: newId(),
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    status,
    order: col.length ? col[col.length - 1].order + 1 : 0,
    weekStart: input.weekStart,
    day: input.day ?? null,
    weeklyGoalId: input.weeklyGoalId ?? null,
    priority: input.priority ?? null,
    dueDate: input.dueDate || null,
    createdAt: ts,
    updatedAt: ts,
  };
  return { ...data, todos: [...data.todos, todo] };
}

export function updateTodo(
  data: AppData,
  id: string,
  patch: Partial<
    Pick<Todo, "title" | "description" | "day" | "weeklyGoalId" | "priority" | "dueDate">
  >,
): AppData {
  return {
    ...data,
    todos: data.todos.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: now() } : t)),
  };
}

export function deleteTodo(data: AppData, id: string): AppData {
  return { ...data, todos: data.todos.filter((t) => t.id !== id) };
}

/**
 * 할 일을 status 열로 옮기고, beforeId 앞에 놓는다 (null이면 열 맨 끝).
 * 대상 열의 order를 0..n으로 다시 매긴다.
 */
export function moveTodo(
  data: AppData,
  id: string,
  status: Status,
  beforeId: string | null = null,
): AppData {
  const todo = data.todos.find((t) => t.id === id);
  if (!todo || beforeId === id) return data;

  const col = columnOf(data, todo.weekStart, status).filter((t) => t.id !== id);
  let idx = beforeId ? col.findIndex((t) => t.id === beforeId) : -1;
  if (idx < 0) idx = col.length;

  const moved: Todo =
    todo.status === status ? todo : { ...todo, status, updatedAt: now() };
  col.splice(idx, 0, moved);
  const newOrder = new Map(col.map((t, i) => [t.id, i]));

  return {
    ...data,
    todos: data.todos.map((t) => {
      if (t.id === id) return { ...moved, order: newOrder.get(id)! };
      const o = newOrder.get(t.id);
      return o === undefined || o === t.order ? t : { ...t, order: o };
    }),
  };
}

export function todosOfWeek(data: AppData, weekStart: string): Todo[] {
  return data.todos.filter((t) => t.weekStart === weekStart);
}
