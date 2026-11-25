"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TodoFormDialog } from "@/components/TodoFormDialog";
import { ProgressBar, Skeleton, WeekNavigator, primaryBtn } from "@/components/ui";
import { todosOfWeek, weeklyGoalsOf } from "@/lib/data";
import { weeklyGoalProgress, weekProgress } from "@/lib/progress";
import { useAppStore, useViewStore, useHydrated } from "@/lib/store";
import type { DayIndex, Todo } from "@/lib/types";
import { DAY_LABELS, dayIndexOf, getWeekStart } from "@/lib/week";

type DayFilter = DayIndex | "all";

export default function DashboardPage() {
  const hydrated = useHydrated();
  const data = useAppStore((s) => s.data);
  const viewWeek = useViewStore((s) => s.viewWeek);

  const [filterState, setFilter] = useState<{ week: string; day: DayFilter } | null>(null);
  const [dialog, setDialog] = useState<{ todo?: Todo } | null>(null);
  const [sortByPriority, setSortByPriority] = useState(false);
  const weekTodos = useMemo(() => todosOfWeek(data, viewWeek), [data, viewWeek]);

  // 현재 시각은 서버 프리렌더 중에 읽으면 안 되므로 복원 이후에만 계산한다
  if (!hydrated) return <Skeleton />;

  const isThisWeek = viewWeek === getWeekStart();
  // 이번 주를 보면 오늘 요일, 다른 주를 보면 전체가 기본값
  const filter: DayFilter =
    filterState?.week === viewWeek ? filterState.day : isThisWeek ? dayIndexOf(new Date()) : "all";
  const visible = filter === "all" ? weekTodos : weekTodos.filter((t) => t.day === filter);
  const weeklyGoals = weeklyGoalsOf(data, viewWeek);

  const isEmpty = data.goals.length === 0 && data.todos.length === 0 && data.weeklyGoals.length === 0;

  return (
    <div className="space-y-5">
      {isEmpty && <Onboarding />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <WeekNavigator />
        <button className={primaryBtn} onClick={() => setDialog({})}>
          + 할 일
        </button>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">이번 주 목표</h2>
          <Link href="/week" className="text-sm text-zinc-500 hover:underline">
            주간 계획 편집 →
          </Link>
        </div>
        <ProgressBar progress={weekProgress(data, viewWeek)} label="주간 진행률" />
        {weeklyGoals.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">이 주에 세운 목표가 없습니다.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weeklyGoals.map((w) => {
              const goal = w.goalId ? data.goals.find((g) => g.id === w.goalId) : null;
              return (
                <li key={w.id} className="rounded-lg bg-zinc-50 p-3">
                  <p className="text-sm font-medium">{w.title}</p>
                  <p className="mb-2 text-xs text-zinc-500">{goal ? `↳ ${goal.title}` : "1년 목표 연결 없음"}</p>
                  <ProgressBar progress={weeklyGoalProgress(data, w.id)} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="요일 필터" className="flex gap-1 overflow-x-auto">
          {(["all", 0, 1, 2, 3, 4, 5, 6] as DayFilter[]).map((d) => {
            const active = filter === d;
            const count = d === "all" ? weekTodos.length : weekTodos.filter((t) => t.day === d).length;
            return (
              <button
                key={d}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter({ week: viewWeek, day: d })}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${
                  active ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {d === "all" ? "전체" : DAY_LABELS[d]}
                {count > 0 && <span className="ml-1 text-xs opacity-60">{count}</span>}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-1.5 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={sortByPriority}
            onChange={(e) => setSortByPriority(e.target.checked)}
          />
          우선순위순 정렬
        </label>
      </div>

      <KanbanBoard todos={visible} sortByPriority={sortByPriority} onEdit={(todo) => setDialog({ todo })} />

      {dialog && (
        <TodoFormDialog
          weekStart={viewWeek}
          todo={dialog.todo}
          defaultDay={filter === "all" ? null : filter}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function Onboarding() {
  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <h2 className="mb-2 font-semibold text-emerald-900">처음 오셨네요! 이렇게 시작해 보세요</h2>
      <ol className="list-inside list-decimal space-y-1 text-sm text-emerald-900">
        <li>
          <Link href="/goals" className="font-medium underline">1년 목표</Link>를 세웁니다.
        </li>
        <li>
          <Link href="/week" className="font-medium underline">주간 계획</Link>에서 이번 주 목표(최대 5개)를 1년 목표와 연결합니다.
        </li>
        <li>여기서 할 일을 만들고 칸반에서 끌어 옮기며 진행합니다.</li>
      </ol>
    </section>
  );
}
