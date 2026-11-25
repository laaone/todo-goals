import type { DayIndex } from "./types";

export const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

const pad = (n: number) => String(n).padStart(2, "0");

/** 로컬 시간 기준 YYYY-MM-DD (toISOString은 UTC라 날짜가 밀릴 수 있어 쓰지 않음) */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 월=0 ... 일=6 */
export function dayIndexOf(d: Date): DayIndex {
  return ((d.getDay() + 6) % 7) as DayIndex;
}

/** 주어진 날짜가 속한 주의 월요일 */
export function getWeekStart(d: Date = new Date()): string {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayIndexOf(d));
  return toISODate(monday);
}

export function addWeeks(weekStart: string, n: number): string {
  const d = parseISODate(weekStart);
  return toISODate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * n));
}

/** 그 주의 특정 요일 날짜 */
export function dateOfDay(weekStart: string, day: DayIndex): Date {
  const d = parseISODate(weekStart);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + day);
}

/** "11/23 – 11/29" */
export function formatWeekRange(weekStart: string): string {
  const s = parseISODate(weekStart);
  const e = dateOfDay(weekStart, 6);
  return `${s.getMonth() + 1}/${s.getDate()} – ${e.getMonth() + 1}/${e.getDate()}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}
