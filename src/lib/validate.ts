/**
 * 서버로 들어온 항목을 검사하고 허용된 필드만 남긴다. 실패하면 null.
 * 클라이언트를 믿지 않는다: userId 같은 필드는 여기서 걸러지고 서버가 쿠키로 붙인다.
 */
import { COLLECTIONS, type CollectionName, type EntityMap, type SyncPayload } from "./sync";
import { STATUSES, type DayIndex, type Priority, type Status } from "./types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ITEMS = 1000;

const str = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max;
const id = (v: unknown): v is string => str(v, 64) && v.length > 0;
const date = (v: unknown): v is string => typeof v === "string" && DATE.test(v);
const iso = (v: unknown): v is string => str(v, 40) && !Number.isNaN(Date.parse(v));
const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const nullable = <T>(check: (v: unknown) => v is T) => (v: unknown): v is T | null =>
  v === null || check(v);

type Validator<T> = (x: Record<string, unknown>) => T | null;

const validators: { [C in CollectionName]: Validator<EntityMap[C]> } = {
  goals: (x) =>
    id(x.id) && str(x.title, 200) && str(x.description, 5000) && num(x.year) && iso(x.createdAt)
      ? { id: x.id, title: x.title, description: x.description, year: x.year, createdAt: x.createdAt }
      : null,

  weeklyPlans: (x) =>
    date(x.weekStart) && str(x.memo, 10000) && str(x.review, 10000)
      ? { weekStart: x.weekStart, memo: x.memo, review: x.review }
      : null,

  weeklyGoals: (x) =>
    id(x.id) && date(x.weekStart) && nullable(id)(x.goalId) && str(x.title, 200) && num(x.order)
      ? { id: x.id, weekStart: x.weekStart, goalId: x.goalId, title: x.title, order: x.order }
      : null,

  todos: (x) => {
    const okDay = x.day === null || (Number.isInteger(x.day) && (x.day as number) >= 0 && (x.day as number) <= 6);
    const okPriority = x.priority === null || ["high", "medium", "low"].includes(x.priority as string);
    if (
      !id(x.id) || !str(x.title, 200) || !str(x.description, 5000) ||
      !STATUSES.includes(x.status as Status) || !num(x.order) || !date(x.weekStart) || !okDay ||
      !nullable(id)(x.weeklyGoalId) || !okPriority || !nullable(date)(x.dueDate) ||
      !iso(x.createdAt) || !iso(x.updatedAt)
    )
      return null;
    return {
      id: x.id, title: x.title, description: x.description, status: x.status as Status,
      order: x.order, weekStart: x.weekStart, day: x.day as DayIndex | null,
      weeklyGoalId: x.weeklyGoalId, priority: x.priority as Priority | null,
      dueDate: x.dueDate, createdAt: x.createdAt, updatedAt: x.updatedAt,
    };
  },
};

/** 동기화 요청 전체를 검사. 하나라도 잘못되면 null */
export function validatePayload(body: unknown): SyncPayload | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const out: Record<string, { upsert: unknown[]; delete: string[] }> = {};
  let count = 0;

  for (const [key, value] of Object.entries(body)) {
    if (!(COLLECTIONS as readonly string[]).includes(key)) return null;
    const c = key as CollectionName;
    if (!value || typeof value !== "object") return null;
    const { upsert = [], delete: del = [] } = value as { upsert?: unknown; delete?: unknown };
    if (!Array.isArray(upsert) || !Array.isArray(del)) return null;

    count += upsert.length + del.length;
    if (count > MAX_ITEMS) return null;

    const checked: unknown[] = [];
    for (const item of upsert) {
      if (!item || typeof item !== "object") return null;
      const v = validators[c](item as Record<string, unknown>);
      if (!v) return null;
      checked.push(v);
    }
    const keyCheck = c === "weeklyPlans" ? date : id;
    if (!del.every((k) => keyCheck(k))) return null;
    out[c] = { upsert: checked, delete: del as string[] };
  }
  return out as SyncPayload;
}
