import { describe, expect, it } from "vitest";
import { addGoal, addTodo, deleteTodo, emptyData, moveTodo, updateWeeklyPlan } from "./data";
import { diffData, isEmptyPayload } from "./sync";
import { validatePayload } from "./validate";

const W = "2026-11-23";

describe("diffData", () => {
  it("변경이 없으면 빈 payload", () => {
    const d = addTodo(emptyData(), { title: "A", weekStart: W });
    expect(isEmptyPayload(diffData(d, d))).toBe(true);
  });

  it("추가·수정된 항목만 upsert, 사라진 항목은 delete", () => {
    let base = emptyData();
    for (const t of ["A", "B", "C"]) base = addTodo(base, { title: t, weekStart: W });
    const [a, b, c] = base.todos;

    let next = moveTodo(base, c.id, "done"); // C만 바뀜 (todo 열 A,B 순서는 그대로)
    next = deleteTodo(next, b.id);
    next = addGoal(next, { title: "G", year: 2026 });
    next = updateWeeklyPlan(next, W, { memo: "m" });

    const p = diffData(base, next);
    expect(p.todos?.upsert?.map((t) => t.title)).toEqual(["C"]);
    expect(p.todos?.delete).toEqual([b.id]);
    expect(p.goals?.upsert).toHaveLength(1);
    expect(p.weeklyPlans?.upsert?.[0].weekStart).toBe(W);
    expect(p.weeklyGoals).toBeUndefined();
    expect(next.todos.find((t) => t.id === a.id)).toBe(a);
  });
});

describe("validatePayload", () => {
  const valid = () => diffData(emptyData(), addTodo(emptyData(), { title: "A", weekStart: W, day: 2 }));

  it("정상 payload는 통과하고 허용되지 않은 필드는 버린다", () => {
    const p = JSON.parse(JSON.stringify(valid())) as { todos: { upsert: Record<string, unknown>[] } };
    p.todos.upsert[0].userId = "someone-else";
    const out = validatePayload(JSON.parse(JSON.stringify(p)));
    expect(out?.todos?.upsert?.[0]).not.toHaveProperty("userId");
    expect(out?.todos?.upsert?.[0].title).toBe("A");
  });

  it("잘못된 값은 거부한다", () => {
    const bad = (mut: (t: Record<string, unknown>) => void) => {
      const p = JSON.parse(JSON.stringify(valid()));
      mut(p.todos.upsert[0]);
      return validatePayload(p);
    };
    expect(bad((t) => (t.status = "archived"))).toBeNull();
    expect(bad((t) => (t.day = 7))).toBeNull();
    expect(bad((t) => (t.weekStart = "2026/11/23"))).toBeNull();
    expect(bad((t) => (t.title = { $gt: "" }))).toBeNull();
    expect(validatePayload({ users: {} })).toBeNull();
    expect(validatePayload([])).toBeNull();
    expect(validatePayload({ todos: { delete: [{ $ne: null }] } })).toBeNull();
  });
});
