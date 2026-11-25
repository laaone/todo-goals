"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TodoFormDialog } from "@/components/TodoFormDialog";
import {
  ProgressBar,
  Skeleton,
  WeekNavigator,
  cardCls,
  pageTitleCls,
  primaryBtn,
  sectionTitleCls,
  textBtn,
} from "@/components/ui";

const linkCls = "font-semibold text-ink underline underline-offset-4";
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
    <div className="space-y-10">
      {isEmpty && <Onboarding />}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <h1 className={pageTitleCls}>{isThisWeek ? "이번 주" : "주간 보드"}</h1>
          <WeekNavigator />
        </div>
        <button className={primaryBtn} onClick={() => setDialog({})} aria-label="할 일 추가">
          <span aria-hidden="true" className="text-lg leading-none">+</span> 할 일
        </button>
      </div>

      <section aria-labelledby="week-goals">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="week-goals" className={sectionTitleCls}>
            이번 주 목표
          </h2>
          <Link href="/week" className={textBtn}>
            주간 계획 편집
          </Link>
        </div>
        <div className={`${cardCls} p-6`}>
          <ProgressBar progress={weekProgress(data, viewWeek)} label="주간 진행률" />
          {weeklyGoals.length === 0 ? (
            <p className="mt-4 text-base text-muted">이 주에 세운 목표가 없습니다.</p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {weeklyGoals.map((w) => {
                const goal = w.goalId ? data.goals.find((g) => g.id === w.goalId) : null;
                return (
                  <li key={w.id} className="rounded-card bg-surface-soft p-4">
                    <p className="text-base font-semibold text-ink">{w.title}</p>
                    <p className="mb-3 text-sm text-muted">{goal ? `↳ ${goal.title}` : "1년 목표 연결 없음"}</p>
                    <ProgressBar progress={weeklyGoalProgress(data, w.id)} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section aria-label="할 일 보드" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="요일 필터" className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1">
            {(["all", 0, 1, 2, 3, 4, 5, 6] as DayFilter[]).map((d) => {
              const active = filter === d;
              const count = d === "all" ? weekTodos.length : weekTodos.filter((t) => t.day === d).length;
              return (
                <button
                  key={d}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter({ week: viewWeek, day: d })}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-ink bg-ink text-on-primary"
                      : "border-hairline bg-canvas text-ink hover:border-ink"
                  }`}
                >
                  {d === "all" ? "전체" : DAY_LABELS[d]}
                  {count > 0 && (
                    <span className={`ml-1.5 tabular-nums ${active ? "text-on-primary/70" : "text-muted"}`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              className="size-4 accent-ink"
              checked={sortByPriority}
              onChange={(e) => setSortByPriority(e.target.checked)}
            />
            우선순위순 정렬
          </label>
        </div>

        <KanbanBoard todos={visible} sortByPriority={sortByPriority} onEdit={(todo) => setDialog({ todo })} />
      </section>

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
    <section className="rounded-card bg-surface-soft p-6 sm:p-8">
      <h2 className={sectionTitleCls}>처음 오셨네요! 이렇게 시작해 보세요</h2>
      <ol className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { n: 1, body: <><Link href="/goals" className={linkCls}>1년 목표</Link>를 세웁니다.</> },
          { n: 2, body: <><Link href="/week" className={linkCls}>주간 계획</Link>에서 이번 주 목표(최대 5개)를 1년 목표와 연결합니다.</> },
          { n: 3, body: <>여기서 할 일을 만들고 칸반에서 끌어 옮기며 진행합니다.</> },
        ].map((s) => (
          <li key={s.n} className="flex gap-3 text-base text-body">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-on-primary">
              {s.n}
            </span>
            <span>{s.body}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
