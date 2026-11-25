import { describe, expect, it } from "vitest";
import { addGoal, addTodo, addWeeklyGoal, emptyData, moveTodo } from "./data";
import { goalProgress, weeklyGoalProgress, weekProgress } from "./progress";

const W1 = "2026-11-23";
const W2 = "2026-11-30";

describe("progress", () => {
  it("할 일이 없으면 0%", () => {
    expect(weekProgress(emptyData(), W1)).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it("4개 중 1개 완료 → 주간 25%", () => {
    let d = emptyData();
    for (const t of ["A", "B", "C", "D"]) d = addTodo(d, { title: t, weekStart: W1 });
    d = moveTodo(d, d.todos[0].id, "done");
    expect(weekProgress(d, W1)).toEqual({ done: 1, total: 4, percent: 25 });
    expect(weekProgress(d, W2).total).toBe(0);
  });

  it("주간 목표·1년 목표 진행률은 연결된 할 일만 센다 (여러 주 합산)", () => {
    let d = addGoal(emptyData(), { title: "G", year: 2026 });
    const g = d.goals[0].id;
    d = addWeeklyGoal(d, { weekStart: W1, title: "WG1", goalId: g });
    d = addWeeklyGoal(d, { weekStart: W2, title: "WG2", goalId: g });
    const [wg1, wg2] = d.weeklyGoals.map((w) => w.id);

    d = addTodo(d, { title: "a", weekStart: W1, weeklyGoalId: wg1 });
    d = addTodo(d, { title: "b", weekStart: W1, weeklyGoalId: wg1 });
    d = addTodo(d, { title: "c", weekStart: W2, weeklyGoalId: wg2 });
    d = addTodo(d, { title: "free", weekStart: W1 }); // 연결 없음
    d = moveTodo(d, d.todos.find((t) => t.title === "a")!.id, "done");
    d = moveTodo(d, d.todos.find((t) => t.title === "c")!.id, "done");

    expect(weeklyGoalProgress(d, wg1).percent).toBe(50);
    expect(weeklyGoalProgress(d, wg2).percent).toBe(100);
    expect(goalProgress(d, g)).toEqual({ done: 2, total: 3, percent: 67 });
  });
});
