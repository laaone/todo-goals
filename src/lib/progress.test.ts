import { describe, expect, it } from "vitest";
import { addGoal, addTodo, addWeeklyGoal, emptyData, moveTodo, toggleWeeklyGoalCheck } from "./data";
import { checkProgress, goalActivity, weeklyGoalsProgress, weekProgress } from "./progress";
import type { AppData, DayIndex } from "./types";

const W1 = "2026-11-23";
const W2 = "2026-11-30";

const check = (d: AppData, id: string, ...days: DayIndex[]) =>
  days.reduce((acc, day) => toggleWeeklyGoalCheck(acc, id, day), d);

describe("할 일 진행률", () => {
  it("할 일이 없으면 0%", () => {
    expect(weekProgress(emptyData(), W1)).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it("4개 중 1개 완료 → 25%", () => {
    let d = emptyData();
    for (const t of ["A", "B", "C", "D"]) d = addTodo(d, { title: t, weekStart: W1 });
    d = moveTodo(d, d.todos[0].id, "done");
    expect(weekProgress(d, W1)).toEqual({ done: 1, total: 4, percent: 25 });
  });
});

describe("주간 목표 횟수 체크", () => {
  it("3회 목표: 3번 체크하면 100%, 넘쳐도 100%", () => {
    let d = addWeeklyGoal(emptyData(), { weekStart: W1, title: "러닝", goalId: null, target: 3 });
    const id = d.weeklyGoals[0].id;
    d = check(d, id, 0, 2);
    expect(checkProgress(d.weeklyGoals[0])).toEqual({ done: 2, total: 3, percent: 67 });
    d = check(d, id, 4);
    expect(checkProgress(d.weeklyGoals[0]).percent).toBe(100);
    d = check(d, id, 5);
    expect(checkProgress(d.weeklyGoals[0])).toEqual({ done: 4, total: 3, percent: 100 });
  });

  it("7일 목표: 7번 체크해야 100%", () => {
    let d = addWeeklyGoal(emptyData(), { weekStart: W1, title: "물 2L", goalId: null, target: 7 });
    const id = d.weeklyGoals[0].id;
    d = check(d, id, 0, 1, 2, 3, 4, 5);
    expect(checkProgress(d.weeklyGoals[0]).percent).toBe(86);
    d = check(d, id, 6);
    expect(checkProgress(d.weeklyGoals[0]).percent).toBe(100);
  });

  it("전체 달성률은 목표별로 목표 횟수까지만 센다", () => {
    let d = addWeeklyGoal(emptyData(), { weekStart: W1, title: "A", goalId: null, target: 2 });
    d = addWeeklyGoal(d, { weekStart: W1, title: "B", goalId: null, target: 3 });
    const [a, b] = d.weeklyGoals.map((w) => w.id);
    d = check(d, a, 0, 1, 2, 3); // 4회지만 2회까지만 센다
    d = check(d, b, 0);
    expect(weeklyGoalsProgress(d.weeklyGoals)).toEqual({ done: 3, total: 5, percent: 60 });
  });
});

describe("1년 목표 실행 기록", () => {
  it("연결된 주간 목표들의 체크를 날짜별·주별로 모은다", () => {
    let d = addGoal(emptyData(), { title: "마라톤", year: 2026 });
    const g = d.goals[0].id;
    d = addWeeklyGoal(d, { weekStart: W1, title: "러닝", goalId: g, target: 3 });
    d = addWeeklyGoal(d, { weekStart: W1, title: "근력", goalId: g, target: 2 });
    d = addWeeklyGoal(d, { weekStart: W2, title: "러닝", goalId: g, target: 3 });
    d = addWeeklyGoal(d, { weekStart: W1, title: "다른 목표", goalId: null, target: 1 });
    const [r1, s1, r2, other] = d.weeklyGoals.map((w) => w.id);
    d = check(d, r1, 0, 2, 4); // 3/3
    d = check(d, s1, 0); // 1/2  → 같은 날(월) 2회
    d = check(d, r2, 1); // 1/3
    d = check(d, other, 3); // 연결 안 됨 → 제외

    const a = goalActivity(d, g, 2026);
    expect(a.totalChecks).toBe(5);
    expect(a.days.get("2026-11-23")).toBe(2);
    expect(a.days.get("2026-12-01")).toBe(1);
    expect(a.days.has("2026-11-26")).toBe(false);
    expect(a.weeks.map((w) => [w.weekStart, w.progress.percent])).toEqual([
      [W1, 80],
      [W2, 33],
    ]);
    expect(a.achievedWeeks).toBe(0);
  });

  it("다른 해의 체크는 세지 않는다", () => {
    let d = addGoal(emptyData(), { title: "G", year: 2026 });
    const g = d.goals[0].id;
    d = addWeeklyGoal(d, { weekStart: "2026-12-28", title: "연말", goalId: g, target: 1 });
    d = check(d, d.weeklyGoals[0].id, 6); // 2027-01-03
    expect(goalActivity(d, g, 2026).totalChecks).toBe(0);
    expect(goalActivity(d, g, 2027).days.get("2027-01-03")).toBe(1);
  });
});
