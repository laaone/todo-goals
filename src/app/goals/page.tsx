"use client";

import { useState, type FormEvent } from "react";
import { GoalActivityChart } from "@/components/GoalCharts";
import {
  PageHeader,
  Skeleton,
  Tile,
  dangerLinkBtn,
  heroTitleCls,
  inputCls,
  linkSmBtn,
  primaryBtn,
  secondaryBtn,
  taglineCls,
  tileTitleCls,
} from "@/components/ui";
import { addGoal, deleteGoal, updateGoal } from "@/lib/data";
import { goalActivity } from "@/lib/progress";
import { useAppStore, useHydrated } from "@/lib/store";
import type { AppData, Goal } from "@/lib/types";

export default function GoalsPage() {
  const hydrated = useHydrated();
  const data = useAppStore((s) => s.data);

  // 현재 연도는 데이터를 불러온 뒤에만 읽는다 (프리렌더 중 현재 시각 사용 금지)
  if (!hydrated) return <Skeleton />;

  const year = new Date().getFullYear();
  const goals = [...data.goals].sort((a, b) => b.year - a.year || a.createdAt.localeCompare(b.createdAt));
  const thisYear = goals.filter((g) => g.year === year);
  const summary = thisYear.map((g) => goalActivity(data, g.id, year));
  const totalChecks = summary.reduce((s, a) => s + a.totalChecks, 0);
  const achievedWeeks = summary.reduce((s, a) => s + a.achievedWeeks, 0);

  return (
    <>
      <PageHeader title="1년 목표" />

      <Tile tone="dark" aria-label={`${year}년 요약`}>
        <div className="text-center">
          <p className="text-[17px] text-on-dark-muted">{year}년</p>
          <h1 className={`${heroTitleCls} text-on-dark`}>1년 목표</h1>
          <p className="mt-2 text-[19px] text-on-dark-muted sm:text-[21px]">
            주간 목표에서 체크한 실행이 여기에 쌓입니다.
          </p>
        </div>
        <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 text-center">
          <Stat label="목표" value={thisYear.length} unit="개" />
          <Stat label="올해 실행" value={totalChecks} unit="회" />
          <Stat label="100% 달성한 주" value={achievedWeeks} unit="주" />
        </dl>
      </Tile>

      {goals.length === 0 ? (
        <Tile tone="parchment">
          <p className="text-center text-[17px] text-muted">아직 1년 목표가 없습니다. 올해 이루고 싶은 것을 적어 보세요.</p>
        </Tile>
      ) : (
        goals.map((g, i) => <GoalSection key={g.id} goal={g} data={data} tone={i % 2 === 0 ? "parchment" : "light"} />)
      )}

      <Tile tone={goals.length % 2 === 0 ? "parchment" : "light"} aria-label="새 1년 목표">
        <h2 className={tileTitleCls}>새 1년 목표</h2>
        <AddGoalForm defaultYear={year} />
      </Tile>
    </>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <dt className="text-sm text-on-dark-muted">{label}</dt>
      <dd className="headline mt-1 text-[34px] text-on-dark tabular-nums sm:text-[48px]">
        {value}
        <span className="ml-0.5 text-[17px] font-normal text-on-dark-muted">{unit}</span>
      </dd>
    </div>
  );
}

function AddGoalForm({ defaultYear }: { defaultYear: number }) {
  const apply = useAppStore((s) => s.apply);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(defaultYear);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    apply((d) => addGoal(d, { title, description, year }));
    setTitle("");
    setDescription("");
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <input
          className={inputCls}
          placeholder="예: 하프 마라톤 완주"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="1년 목표 제목"
        />
        <input type="number" className={inputCls} value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="연도" />
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

function GoalSection({ goal, data, tone }: { goal: Goal; data: AppData; tone: "light" | "parchment" }) {
  const apply = useAppStore((s) => s.apply);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description);

  const activity = goalActivity(data, goal.id, goal.year);
  const linked = data.weeklyGoals.filter((w) => w.goalId === goal.id).length;

  function save(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    apply((d) => updateGoal(d, goal.id, { title: title.trim(), description: description.trim() }));
    setEditing(false);
  }

  return (
    <Tile tone={tone} aria-label={goal.title}>
      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="목표 제목" />
          <textarea className={inputCls} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} aria-label="목표 설명" />
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm text-muted">{goal.year}년 목표</p>
            <h2 className={tileTitleCls}>{goal.title}</h2>
            {goal.description && <p className={`mt-2 whitespace-pre-wrap ${taglineCls}`}>{goal.description}</p>}
          </div>
          <div className="flex shrink-0 gap-4 pt-1">
            <button className={linkSmBtn} onClick={() => setEditing(true)}>
              수정
            </button>
            <button
              className={dangerLinkBtn}
              onClick={() => {
                if (confirm(`"${goal.title}" 목표를 삭제할까요? 연결된 주간 목표와 할 일은 남습니다.`))
                  apply((d) => deleteGoal(d, goal.id));
              }}
            >
              삭제
            </button>
          </div>
        </div>
      )}

      <dl className="mt-8 grid grid-cols-3 gap-4 sm:max-w-xl">
        <GoalStat label="총 실행" value={activity.totalChecks} unit="회" />
        <GoalStat label="100% 달성" value={activity.achievedWeeks} unit="주" />
        <GoalStat label="연결된 주간 목표" value={linked} unit="개" />
      </dl>

      <div className="mt-8 rounded-card bg-canvas p-5 sm:p-6">
        {linked === 0 ? (
          <p className="text-[15px] text-muted">
            아직 연결된 주간 목표가 없습니다. 주간 계획에서 주간 목표를 만들 때 이 목표를 선택하면 실행 기록이 쌓입니다.
          </p>
        ) : (
          <GoalActivityChart year={goal.year} days={activity.days} weeks={activity.weeks} title={goal.title} />
        )}
      </div>
    </Tile>
  );
}

function GoalStat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="headline text-[28px] text-ink tabular-nums" data-testid={`stat-${label}`}>
        {value}
        <span className="ml-0.5 text-[15px] font-normal text-muted">{unit}</span>
      </dd>
    </div>
  );
}
