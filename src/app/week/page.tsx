"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ProgressBar, Skeleton, WeekNavigator, cardCls, dangerTextBtn, inputCls, pageTitleCls, primaryBtn, sectionTitleCls } from "@/components/ui";
import {
  addWeeklyGoal,
  canAddWeeklyGoal,
  deleteWeeklyGoal,
  getWeeklyPlan,
  updateWeeklyGoal,
  updateWeeklyPlan,
  weeklyGoalsOf,
} from "@/lib/data";
import { weeklyGoalProgress, weekProgress } from "@/lib/progress";
import { useAppStore, useViewStore, useHydrated } from "@/lib/store";
import { MAX_WEEKLY_GOALS, type Goal, type WeeklyGoal } from "@/lib/types";

export default function WeekPage() {
  const hydrated = useHydrated();
  const data = useAppStore((s) => s.data);
  const apply = useAppStore((s) => s.apply);
  const viewWeek = useViewStore((s) => s.viewWeek);

  if (!hydrated) return <Skeleton />;

  const weeklyGoals = weeklyGoalsOf(data, viewWeek);
  const plan = getWeeklyPlan(data, viewWeek);
  const canAdd = canAddWeeklyGoal(data, viewWeek);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={pageTitleCls}>주간 계획</h1>
        <WeekNavigator />
      </div>

      <section className={`${cardCls} p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={sectionTitleCls}>
            이번 주 목표{" "}
            <span className="text-base font-medium text-muted">
              {weeklyGoals.length}/{MAX_WEEKLY_GOALS}
            </span>
          </h2>
        </div>
        <ProgressBar progress={weekProgress(data, viewWeek)} label="주간 진행률" />

        <ul className="mt-6 space-y-3">
          {weeklyGoals.map((w) => (
            <WeeklyGoalRow key={w.id} wg={w} goals={data.goals} />
          ))}
        </ul>

        <AddWeeklyGoalForm key={viewWeek} weekStart={viewWeek} goals={data.goals} disabled={!canAdd} />
        {data.goals.length === 0 && (
          <p className="mt-3 text-sm text-muted">
            연결할 1년 목표가 없습니다. <Link href="/goals" className="font-medium text-ink underline underline-offset-4">1년 목표</Link>를 먼저 만들어 보세요.
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className={`${cardCls} block p-6`}>
          <span className={`${sectionTitleCls} mb-3 block`}>주간 메모</span>
          <textarea
            key={`memo-${viewWeek}`}
            className={inputCls}
            rows={6}
            placeholder="이번 주에 기억할 것, 계획 메모"
            defaultValue={plan.memo}
            onChange={(e) => {
              const memo = e.target.value;
              apply((d) => updateWeeklyPlan(d, viewWeek, { memo }));
            }}
          />
        </label>
        <label className={`${cardCls} block p-6`}>
          <span className={`${sectionTitleCls} mb-3 block`}>주간 회고</span>
          <textarea
            key={`review-${viewWeek}`}
            className={inputCls}
            rows={6}
            placeholder="잘한 점, 아쉬운 점, 다음 주에 바꿀 것"
            defaultValue={plan.review}
            onChange={(e) => {
              const review = e.target.value;
              apply((d) => updateWeeklyPlan(d, viewWeek, { review }));
            }}
          />
        </label>
      </section>
    </div>
  );
}

function GoalSelect({
  goals,
  value,
  onChange,
}: {
  goals: Goal[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} aria-label="연결할 1년 목표">
      <option value="">1년 목표 연결 안 함</option>
      {goals.map((g) => (
        <option key={g.id} value={g.id}>
          {g.year} · {g.title}
        </option>
      ))}
    </select>
  );
}

function AddWeeklyGoalForm({
  weekStart,
  goals,
  disabled,
}: {
  weekStart: string;
  goals: Goal[];
  disabled: boolean;
}) {
  const apply = useAppStore((s) => s.apply);
  const [title, setTitle] = useState("");
  const [goalId, setGoalId] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || disabled) return;
    apply((d) => addWeeklyGoal(d, { weekStart, title, goalId: goalId || null }));
    setTitle("");
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-3 border-t border-hairline pt-6 sm:grid-cols-[1fr_1fr_auto]">
      <input
        className={inputCls}
        placeholder={disabled ? `주간 목표는 최대 ${MAX_WEEKLY_GOALS}개입니다` : "새 주간 목표"}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={disabled}
        aria-label="새 주간 목표 제목"
      />
      <GoalSelect goals={goals} value={goalId} onChange={setGoalId} />
      <button type="submit" className={primaryBtn} disabled={disabled || !title.trim()}>
        추가
      </button>
    </form>
  );
}

function WeeklyGoalRow({ wg, goals }: { wg: WeeklyGoal; goals: Goal[] }) {
  const data = useAppStore((s) => s.data);
  const apply = useAppStore((s) => s.apply);
  const [title, setTitle] = useState(wg.title);

  function saveTitle() {
    const t = title.trim();
    if (t && t !== wg.title) apply((d) => updateWeeklyGoal(d, wg.id, { title: t }));
    else setTitle(wg.title);
  }

  return (
    <li className="grid gap-3 rounded-card bg-surface-soft p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
      <input
        className={inputCls}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        aria-label="주간 목표 제목"
      />
      <GoalSelect
        goals={goals}
        value={wg.goalId ?? ""}
        onChange={(v) => apply((d) => updateWeeklyGoal(d, wg.id, { goalId: v || null }))}
      />
      <button
        className={dangerTextBtn}
        onClick={() => {
          if (confirm(`주간 목표 "${wg.title}"을(를) 삭제할까요? 연결된 할 일은 남습니다.`))
            apply((d) => deleteWeeklyGoal(d, wg.id));
        }}
      >
        삭제
      </button>
      <div className="sm:col-span-3">
        <ProgressBar progress={weeklyGoalProgress(data, wg.id)} />
      </div>
    </li>
  );
}
