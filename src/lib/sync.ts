/**
 * 클라이언트 ↔ 서버 동기화 형식. 클라이언트는 마지막으로 서버가 확인한 데이터와
 * 현재 데이터의 차이(diff)만 보낸다. data.ts의 순수 함수는 바뀌지 않은 항목의 참조를
 * 그대로 두므로, 참조 비교만으로 바뀐 항목을 찾을 수 있다.
 */
import type { AppData, Goal, Todo, WeeklyGoal, WeeklyPlan } from "./types";

export const COLLECTIONS = ["goals", "weeklyPlans", "weeklyGoals", "todos"] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

export interface EntityMap {
  goals: Goal;
  weeklyPlans: WeeklyPlan;
  weeklyGoals: WeeklyGoal;
  todos: Todo;
}

/** 컬렉션별 항목 키. weeklyPlans는 weekStart가 키 */
export function keyOf<C extends CollectionName>(c: C, item: EntityMap[C]): string {
  return c === "weeklyPlans" ? (item as WeeklyPlan).weekStart : (item as { id: string }).id;
}

export type SyncPayload = {
  [C in CollectionName]?: { upsert?: EntityMap[C][]; delete?: string[] };
};

export function diffData(prev: AppData, next: AppData): SyncPayload {
  const payload: SyncPayload = {};
  for (const c of COLLECTIONS) {
    const before = new Map<string, unknown>(
      (prev[c] as EntityMap[typeof c][]).map((x) => [keyOf(c, x), x]),
    );
    const upsert: unknown[] = [];
    for (const item of next[c] as EntityMap[typeof c][]) {
      const k = keyOf(c, item);
      if (before.get(k) !== item) upsert.push(item);
      before.delete(k);
    }
    const del = [...before.keys()];
    if (upsert.length || del.length) {
      (payload as Record<string, unknown>)[c] = {
        ...(upsert.length ? { upsert } : {}),
        ...(del.length ? { delete: del } : {}),
      };
    }
  }
  return payload;
}

export function isEmptyPayload(p: SyncPayload): boolean {
  return Object.keys(p).length === 0;
}

export function isEmptyData(d: AppData): boolean {
  return COLLECTIONS.every((c) => d[c].length === 0);
}
