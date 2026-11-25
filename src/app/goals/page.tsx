"use client";

import { useState, type FormEvent } from "react";
import { ProgressBar, Skeleton, cardCls, dangerTextBtn, inputCls, pageTitleCls, primaryBtn, secondaryBtn, textBtn } from "@/components/ui";
import { addGoal, deleteGoal, updateGoal } from "@/lib/data";
import { goalProgress } from "@/lib/progress";
import { useAppStore, useHydrated } from "@/lib/store";
import type { Goal } from "@/lib/types";

export default function GoalsPage() {
  const hydrated = useHydrated();
  const data = useAppStore((s) => s.data);

  if (!hydrated) return <Skeleton />;

  const goals = [...data.goals].sort((a, b) => b.year - a.year || a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitleCls}>1년 목표</h1>
        <p className="mt-1 text-base text-muted">올해 이루고 싶은 것. 주간 목표가 여기에 연결됩니다.</p>
      </div>
      <AddGoalForm />
      {goals.length === 0 ? (
        <p className="rounded-card bg-surface-soft p-8 text-center text-base text-muted">아직 1년 목표가 없습니다. 올해 이루고 싶은 것을 적어 보세요.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AddGoalForm() {
  const apply = useAppStore((s) => s.apply);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(() => new Date().getFullYear());

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    apply((d) => addGoal(d, { title, description, year }));
    setTitle("");
    setDescription("");
  }

  return (
    <form onSubmit={submit} className={`${cardCls} space-y-3 p-6`}>
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <input
          className={inputCls}
          placeholder="1년 목표 (예: 하프 마라톤 완주)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="1년 목표 제목"
        />
        <input
          type="number"
          className={inputCls}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          aria-label="연도"
        />
      </div>
      <textarea
        className={inputCls}
        rows={2}
        placeholder="설명 (왜 이 목표인지, 어떻게 달성할지)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        aria-label="목표 설명"
      />
      <div className="flex justify-end">
        <button type="submit" className={primaryBtn} disabled={!title.trim()}>
          목표 추가
        </button>
      </div>
    </form>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const data = useAppStore((s) => s.data);
  const apply = useAppStore((s) => s.apply);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description);

  const linkedWeeks = data.weeklyGoals.filter((w) => w.goalId === goal.id);

  function save(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    apply((d) => updateGoal(d, goal.id, { title: title.trim(), description: description.trim() }));
    setEditing(false);
  }

  return (
    <li className={`${cardCls} p-6 transition-shadow hover:shadow-float`}>
      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="목표 제목" />
          <textarea
            className={inputCls}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="목표 설명"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => {
                setTitle(goal.title);
                setDescription(goal.description);
                setEditing(false);
              }}
            >
              취소
            </button>
            <button type="submit" className={primaryBtn}>
              저장
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-sm font-medium text-muted">{goal.year}년</span>
              <h2 className="text-xl font-semibold text-ink">{goal.title}</h2>
            </div>
            <div className="flex shrink-0 gap-1">
              <button className={textBtn} onClick={() => setEditing(true)}>
                수정
              </button>
              <button
                className={dangerTextBtn}
                onClick={() => {
                  if (confirm(`"${goal.title}" 목표를 삭제할까요? 연결된 주간 목표와 할 일은 남습니다.`))
                    apply((d) => deleteGoal(d, goal.id));
                }}
              >
                삭제
              </button>
            </div>
          </div>
          {goal.description && <p className="mt-2 whitespace-pre-wrap text-base text-body">{goal.description}</p>}
        </>
      )}
      <div className="mt-5">
        <ProgressBar progress={goalProgress(data, goal.id)} label={`목표 진행률 · 주간 목표 ${linkedWeeks.length}개 연결`} />
      </div>
    </li>
  );
}
