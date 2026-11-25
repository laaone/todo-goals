import { describe, expect, it } from "vitest";
import {
  addGoal,
  addTodo,
  addWeeklyGoal,
  canAddWeeklyGoal,
  deleteGoal,
  deleteTodo,
  deleteWeeklyGoal,
  emptyData,
  getWeeklyPlan,
  moveTodo,
  updateTodo,
  updateWeeklyPlan,
  weeklyGoalsOf,
} from "./data";
import type { AppData, Status } from "./types";

const W = "2026-11-23";

function withTodos(...titles: string[]): AppData {
  return titles.reduce((d, title) => addTodo(d, { title, weekStart: W }), emptyData());
}
const titles = (d: AppData, status: Status) =>
  d.todos
    .filter((t) => t.status === status)
    .sort((a, b) => a.order - b.order)
    .map((t) => t.title);
const idOf = (d: AppData, title: string) => d.todos.find((t) => t.title === title)!.id;

describe("할 일 CRUD", () => {
  it("생성·수정·삭제", () => {
    let d = withTodos("A");
    const id = idOf(d, "A");
    expect(d.todos[0]).toMatchObject({ status: "todo", day: null, weeklyGoalId: null });

    d = updateTodo(d, id, { title: "A2", day: 1 });
    expect(d.todos[0]).toMatchObject({ title: "A2", day: 1 });

    d = deleteTodo(d, id);
    expect(d.todos).toHaveLength(0);
  });

  it("입력 데이터를 바꾸지 않는다", () => {
    const d = withTodos("A");
    const snapshot = JSON.stringify(d);
    updateTodo(d, idOf(d, "A"), { title: "X" });
    moveTodo(d, idOf(d, "A"), "done");
    expect(JSON.stringify(d)).toBe(snapshot);
  });
});

describe("moveTodo", () => {
  it("다른 열로 옮기면 상태가 바뀌고 맨 끝에 놓인다", () => {
    let d = withTodos("A", "B", "C");
    d = moveTodo(d, idOf(d, "A"), "doing");
    d = moveTodo(d, idOf(d, "B"), "doing");
    expect(titles(d, "doing")).toEqual(["A", "B"]);
    expect(titles(d, "todo")).toEqual(["C"]);
  });

  it("beforeId 앞에 끼워 넣는다", () => {
    let d = withTodos("A", "B", "C");
    d = moveTodo(d, idOf(d, "C"), "todo", idOf(d, "A"));
    expect(titles(d, "todo")).toEqual(["C", "A", "B"]);
    d = moveTodo(d, idOf(d, "C"), "todo", null);
    expect(titles(d, "todo")).toEqual(["A", "B", "C"]);
  });

  it("없는 id는 무시한다", () => {
    const d = withTodos("A");
    expect(moveTodo(d, "nope", "done")).toBe(d);
  });
});

describe("주간 목표", () => {
  it("주당 5개까지만 추가된다", () => {
    let d = emptyData();
    for (let i = 0; i < 6; i++) d = addWeeklyGoal(d, { weekStart: W, title: `G${i}`, goalId: null });
    expect(weeklyGoalsOf(d, W)).toHaveLength(5);
    expect(canAddWeeklyGoal(d, W)).toBe(false);
    expect(canAddWeeklyGoal(d, "2026-11-30")).toBe(true);
  });

  it("삭제하면 할 일은 남고 연결만 해제된다", () => {
    let d = addWeeklyGoal(emptyData(), { weekStart: W, title: "WG", goalId: null });
    const wgId = d.weeklyGoals[0].id;
    d = addTodo(d, { title: "T", weekStart: W, weeklyGoalId: wgId });
    d = deleteWeeklyGoal(d, wgId);
    expect(d.weeklyGoals).toHaveLength(0);
    expect(d.todos[0].weeklyGoalId).toBeNull();
  });
});

describe("1년 목표", () => {
  it("삭제하면 주간 목표·할 일은 남고 연결만 해제된다", () => {
    let d = addGoal(emptyData(), { title: "G", year: 2026 });
    const gId = d.goals[0].id;
    d = addWeeklyGoal(d, { weekStart: W, title: "WG", goalId: gId });
    const wgId = d.weeklyGoals[0].id;
    d = addTodo(d, { title: "T", weekStart: W, weeklyGoalId: wgId });
    d = deleteGoal(d, gId);
    expect(d.goals).toHaveLength(0);
    expect(d.weeklyGoals[0].goalId).toBeNull();
    expect(d.todos[0].weeklyGoalId).toBe(wgId);
  });
});

describe("주간 메모/회고", () => {
  it("주별로 따로 저장된다", () => {
    let d = updateWeeklyPlan(emptyData(), W, { memo: "이번 주" });
    d = updateWeeklyPlan(d, W, { review: "회고" });
    expect(getWeeklyPlan(d, W)).toEqual({ weekStart: W, memo: "이번 주", review: "회고" });
    expect(getWeeklyPlan(d, "2026-11-30").memo).toBe("");
    expect(d.weeklyPlans).toHaveLength(1);
  });
});
