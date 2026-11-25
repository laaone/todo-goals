"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TodoFormDialog } from "@/components/TodoFormDialog";
import { WeeklyGoalCard } from "@/components/WeeklyGoalParts";
import {
  PageHeader,
  ProgressBar,
  Skeleton,
  Tile,
  WeekNavigator,
  heroTitleCls,
  linkBtn,
  primarySmBtn,
  secondaryBtn,
  sectionTitleCls,
  taglineCls,
  tileTitleCls,
} from "@/components/ui";
import { todosOfWeek, weeklyGoalsOf } from "@/lib/data";
import { weeklyGoalsProgress, weekProgress } from "@/lib/progress";
import { useAppStore, useHydrated, useViewStore } from "@/lib/store";
import type { DayIndex, Todo } from "@/lib/types";
import { DAY_LABELS, dateOfDay, dayIndexOf, getWeekStart, parseISODate, toISODate, todayISO } from "@/lib/week";

type DayFilter = DayIndex | "all";
const DAYS: DayIndex[] = [0, 1, 2, 3, 4, 5, 6];

export default function DashboardPage() {
  const hydrated = useHydrated();
  const data = useAppStore((s) => s.data);
  const viewWeek = useViewStore((s) => s.viewWeek);

  const [filterState, setFilter] = useState<{ week: string; day: DayFilter } | null>(null);
  const [dialog, setDialog] = useState<{ todo?: Todo } | null>(null);
  const [sortByPriority, setSortByPriority] = useState(false);
  const weekTodos = useMemo(() => todosOfWeek(data, viewWeek), [data, viewWeek]);

  // 현재 시각은 서버 프리렌더 중에 읽으면 안 되므로 데이터를 불러온 뒤에만 계산한다
  if (!hydrated) return <Skeleton />;

  const isThisWeek = viewWeek === getWeekStart();
  // 이번 주를 보면 오늘, 다른 주를 보면 전체가 기본
  const filter: DayFilter =
    filterState?.week === viewWeek ? filterState.day : isThisWeek ? dayIndexOf(new Date()) : "all";
  const visible = filter === "all" ? weekTodos : weekTodos.filter((t) => t.day === filter);
  const weeklyGoals = weeklyGoalsOf(data, viewWeek);
  const isEmpty = data.goals.length === 0 && data.todos.length === 0 && data.weeklyGoals.length === 0;

  const start = parseISODate(viewWeek);
  const end = dateOfDay(viewWeek, 6);
  const range =
    start.getMonth() === end.getMonth()
      ? `${start.getMonth() + 1}월 ${start.getDate()}일 – ${end.getDate()}일`
      : `${start.getMonth() + 1}월 ${start.getDate()}일 – ${end.getMonth() + 1}월 ${end.getDate()}일`;
  const boardTitle =
    filter === "all"
      ? "이번 주 할 일"
      : (() => {
          const d = dateOfDay(viewWeek, filter);
          return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAY_LABELS[filter]}요일`;
        })();

  return (
    <>
      <PageHeader title="대시보드">
        <button className={primarySmBtn} onClick={() => setDialog({})} aria-label="할 일 추가">
          <span aria-hidden="true">+</span> 할 일
        </button>
      </PageHeader>

      {isEmpty && <Onboarding />}

      <Tile tone="light" aria-label="이번 주 달력">
        <div className="text-center">
          <h1 className={heroTitleCls}>{isThisWeek ? "이번 주" : "주간 보드"}</h1>
          <p className={`mt-2 ${taglineCls}`}>{range}</p>
          <div className="mt-6">
            <WeekNavigator align="center" />
          </div>
        </div>
        <CalendarStrip
          weekStart={viewWeek}
          filter={filter}
          counts={DAYS.map((d) => weekTodos.filter((t) => t.day === d).length)}
          total={weekTodos.length}
          onSelect={(day) => setFilter({ week: viewWeek, day })}
        />
      </Tile>

      <Tile tone="parchment" aria-labelledby="week-goals">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="week-goals" className={tileTitleCls}>
              이번 주 목표
            </h2>
            <p className="mt-1 text-[17px] text-muted">실행한 날을 체크하면 목표 횟수 대비 달성률이 올라갑니다.</p>
          </div>
          <Link href="/week" className={linkBtn}>
            주간 계획 편집 ›
          </Link>
        </div>
        {weeklyGoals.length === 0 ? (
          <div className="mt-8 rounded-card bg-canvas p-8 text-center">
            <p className="text-[17px] text-muted">이 주에 세운 목표가 없습니다.</p>
            <Link href="/week" className={`${secondaryBtn} mt-5`}>
              주간 목표 세우기
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8 max-w-md">
              <ProgressBar progress={weeklyGoalsProgress(weeklyGoals)} label="주간 목표 달성률" unit="회" />
            </div>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {weeklyGoals.map((w) => (
                <WeeklyGoalCard key={w.id} wg={w} goal={w.goalId ? (data.goals.find((g) => g.id === w.goalId) ?? null) : null} />
              ))}
            </ul>
          </>
        )}
      </Tile>

      <Tile tone="light" aria-label="할 일 보드">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className={tileTitleCls}>{boardTitle}</h2>
            <div className="mt-4 w-72 max-w-full">
              <ProgressBar progress={weekProgress(data, viewWeek)} label="할 일 진행률" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={sortByPriority}
              onChange={(e) => setSortByPriority(e.target.checked)}
            />
            우선순위순 정렬
          </label>
        </div>
        <div className="mt-8">
          <KanbanBoard todos={visible} sortByPriority={sortByPriority} onEdit={(todo) => setDialog({ todo })} />
        </div>
      </Tile>

      {dialog && (
        <TodoFormDialog
          weekStart={viewWeek}
          todo={dialog.todo}
          defaultDay={filter === "all" ? null : filter}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}

/** 달력처럼 날짜가 보이는 요일 선택. 오늘은 파란 날짜, 선택한 날은 파란 테두리 */
function CalendarStrip({
  weekStart,
  filter,
  counts,
  total,
  onSelect,
}: {
  weekStart: string;
  filter: DayFilter;
  counts: number[];
  total: number;
  onSelect: (day: DayFilter) => void;
}) {
  const today = todayISO();
  const cell = (selected: boolean) =>
    // relative: 안의 sr-only(절대 위치) 글자가 가로 스크롤 영역 밖으로 빠져 페이지 폭을 늘리지 않게 한다
    `press relative flex min-w-[76px] flex-1 flex-col items-center rounded-card px-2 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus ${
      selected ? "bg-canvas ring-2 ring-primary-focus" : "bg-parchment hover:bg-divider-soft"
    }`;
  return (
    <div role="tablist" aria-label="요일 필터" className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
      <button role="tab" aria-selected={filter === "all"} onClick={() => onSelect("all")} className={cell(filter === "all")}>
        <span className="text-sm text-muted">전체</span>
        <span className="headline text-[28px] leading-tight text-ink">7일</span>
        <span className="text-xs text-muted tabular-nums">할 일 {total}</span>
      </button>
      {DAYS.map((d) => {
        const date = dateOfDay(weekStart, d);
        const isToday = toISODate(date) === today;
        const weekend = d >= 5;
        return (
          <button key={d} role="tab" aria-selected={filter === d} onClick={() => onSelect(d)} className={cell(filter === d)}>
            <span className={`text-sm ${weekend ? "text-muted-48" : "text-muted"}`}>
              {DAY_LABELS[d]}
              <span className="sr-only">요일 {date.getMonth() + 1}월</span>
            </span>
            <span className={`headline text-[28px] leading-tight tabular-nums ${isToday ? "text-primary" : "text-ink"}`}>
              {date.getDate()}
              <span className="sr-only">일{isToday ? " 오늘" : ""}</span>
            </span>
            <span className={`text-xs tabular-nums ${isToday ? "font-semibold text-primary" : "text-muted"}`}>
              {isToday ? "오늘" : counts[d] ? `할 일 ${counts[d]}` : "·"}
              {isToday && counts[d] ? ` · ${counts[d]}` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Onboarding() {
  const steps = [
    { n: 1, href: "/goals", link: "1년 목표", rest: "를 세웁니다." },
    { n: 2, href: "/week", link: "주간 계획", rest: "에서 이번 주 목표와 횟수를 정하고 1년 목표와 연결합니다." },
    { n: 3, href: null, link: "", rest: "실행한 날을 체크하고, 할 일은 칸반에서 끌어 옮기며 진행합니다." },
  ];
  return (
    <Tile tone="dark">
      <h2 className={`${sectionTitleCls} text-on-dark`}>처음 오셨네요. 이렇게 시작해 보세요.</h2>
      <ol className="mt-6 grid gap-6 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="text-[17px] text-on-dark-muted">
            <span className="headline block text-[34px] text-on-dark">{s.n}</span>
            {s.href && (
              <Link href={s.href} className="text-primary-on-dark underline-offset-4 hover:underline">
                {s.link}
              </Link>
            )}
            {s.rest}
          </li>
        ))}
      </ol>
    </Tile>
  );
}
