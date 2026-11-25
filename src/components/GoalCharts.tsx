"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { WeekActivity } from "@/lib/progress";
import { DAY_LABELS, addWeeks, getWeekStart, parseISODate, toISODate, todayISO } from "@/lib/week";

/*
 * 1년 목표 실행 기록 그래프 (docs/Apple DESIGN.md + dataviz 규칙)
 * - 위: 날짜별 체크 히트맵 (한 해의 주 × 요일). 파랑 한 가지, 많을수록 진하게
 * - 아래: 같은 주 칸에 맞춘 주별 달성률 막대 + 100% 기준선
 * - 칸/막대마다 마우스·포커스 툴팁, 표로 보기 제공
 */

const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;
const LEFT = 26; // 요일 라벨 자리
const TOP = 18; // 월 라벨 자리
const BAR_H = 56;
const HEAT = ["var(--color-heat-0)", "var(--color-heat-1)", "var(--color-heat-2)", "var(--color-heat-3)"];
const level = (n: number) => (n <= 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : 3);
const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

/** 그 해를 덮는 주들의 월요일 목록 */
function weeksOfYear(year: number): string[] {
  const first = getWeekStart(new Date(year, 0, 1));
  const last = getWeekStart(new Date(year, 11, 31));
  const out: string[] = [];
  for (let w = first; w <= last; w = addWeeks(w, 1)) out.push(w);
  return out;
}

interface Tip {
  x: number;
  y: number;
  text: ReactNode;
}

export function GoalActivityChart({
  year,
  days,
  weeks,
  title,
}: {
  year: number;
  days: Map<string, number>;
  weeks: WeekActivity[];
  title: string;
}) {
  const columns = useMemo(() => weeksOfYear(year), [year]);
  const width = LEFT + columns.length * STEP;
  const heatH = TOP + 7 * STEP;
  const today = todayISO();
  const byWeek = new Map(weeks.map((w) => [w.weekStart, w]));
  const [tip, setTip] = useState<Tip | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // 좁은 화면에서는 최근(오른쪽) 주가 보이도록 끝으로 스크롤
  useEffect(() => {
    const el = scroller.current;
    if (el && year === new Date().getFullYear()) {
      const todayCol = columns.indexOf(getWeekStart());
      el.scrollLeft = Math.max(0, LEFT + todayCol * STEP - el.clientWidth + 6 * STEP);
    }
  }, [year, columns]);

  const show = (x: number, y: number, text: ReactNode) => setTip({ x, y, text });
  const hide = () => setTip(null);

  // 월 라벨: 그 달 1일이 들어 있는 주 칸 위
  const monthLabels = Array.from({ length: 12 }, (_, m) => {
    const col = columns.indexOf(getWeekStart(new Date(year, m, 1)));
    return { m, x: LEFT + col * STEP };
  });

  return (
    <figure className="m-0">
      <div ref={scroller} className="relative overflow-x-auto pb-2" onPointerLeave={hide}>
        <div className="relative" style={{ width }}>
          {/* 히트맵 */}
          <svg
            width={width}
            height={heatH}
            role="img"
            aria-label={`${title}: ${year}년 날짜별 실행 체크 히트맵. 표로 보기에서 주별 수치를 볼 수 있습니다.`}
          >
            {monthLabels.map(({ m, x }) => (
              <text key={m} x={x} y={11} className="fill-muted text-[11px]">
                {m + 1}월
              </text>
            ))}
            {[0, 2, 4].map((d) => (
              <text key={d} x={0} y={TOP + d * STEP + CELL - 2} className="fill-muted text-[11px]">
                {DAY_LABELS[d]}
              </text>
            ))}
            {columns.map((weekStart, c) =>
              Array.from({ length: 7 }, (_, d) => {
                const date = new Date(parseISODate(weekStart).getTime());
                date.setDate(date.getDate() + d);
                if (date.getFullYear() !== year) return null;
                const key = toISODate(date);
                const n = days.get(key) ?? 0;
                const future = key > today;
                const x = LEFT + c * STEP;
                const y = TOP + d * STEP;
                return (
                  <rect
                    key={key}
                    x={x}
                    y={y}
                    width={CELL}
                    height={CELL}
                    rx={3}
                    fill={HEAT[level(n)]}
                    opacity={future ? 0.45 : 1}
                    stroke={key === today ? "var(--color-primary)" : "none"}
                    strokeWidth={key === today ? 1.5 : 0}
                    onPointerEnter={() =>
                      show(x + CELL / 2, y, (
                        <>
                          <b>{n ? `${n}회 실행` : "실행 없음"}</b> · {md(date)} ({DAY_LABELS[d]})
                        </>
                      ))
                    }
                  />
                );
              }),
            )}
          </svg>

          {/* 주별 달성률 막대: 히트맵과 같은 주 칸에 맞춘다 */}
          <svg width={width} height={BAR_H + 20} aria-hidden="true" className="mt-3 block">
            <line x1={LEFT} x2={width} y1={0.5} y2={0.5} stroke="var(--color-hairline)" strokeDasharray="3 3" />
            <text x={0} y={9} className="fill-muted text-[10px]">
              100
            </text>
            <line x1={LEFT} x2={width} y1={BAR_H + 0.5} y2={BAR_H + 0.5} stroke="var(--color-hairline)" />
            {columns.map((weekStart, c) => {
              const w = byWeek.get(weekStart);
              const x = LEFT + c * STEP;
              const h = w ? Math.max(2, (w.progress.percent / 100) * BAR_H) : 0;
              const start = parseISODate(weekStart);
              return (
                <g key={weekStart}>
                  {w && <rect x={x + 1} y={BAR_H - h} width={CELL - 2} height={h} rx={2} fill="var(--color-primary)" />}
                  {/* 막대보다 넓은 마우스 영역 */}
                  <rect
                    x={x - GAP / 2}
                    y={0}
                    width={STEP}
                    height={BAR_H}
                    fill="transparent"
                    onPointerEnter={() =>
                      show(x + CELL / 2, heatH + 12 + (w ? BAR_H - h : BAR_H), (
                        w ? (
                          <>
                            <b>{w.progress.percent}% 달성</b> · {md(start)} 주 ({w.progress.done}/{w.progress.total}회)
                          </>
                        ) : (
                          <>{md(start)} 주 · 주간 목표 없음</>
                        )
                      ))
                    }
                  />
                </g>
              );
            })}
            <text x={LEFT} y={BAR_H + 15} className="fill-muted text-[11px]">
              주별 달성률
            </text>
          </svg>

          {tip && (
            <div
              role="status"
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-util bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-on-dark"
              style={{ left: tip.x, top: tip.y - 6 }}
            >
              {tip.text}
            </div>
          )}
        </div>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          적음
          {HEAT.map((c) => (
            <span key={c} className="inline-block size-3 rounded-[3px]" style={{ background: c }} />
          ))}
          많음
          <span className="ml-3 inline-block size-3 rounded-[3px] border-[1.5px] border-primary" /> 오늘
        </span>
        <WeeksTable weeks={weeks} />
      </figcaption>
    </figure>
  );
}

/** 색으로만 정보를 주지 않도록 표로도 제공 */
function WeeksTable({ weeks }: { weeks: WeekActivity[] }) {
  if (weeks.length === 0) return null;
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-primary">표로 보기</summary>
      <table className="mt-2 text-left text-sm text-ink">
        <thead className="text-muted">
          <tr>
            <th className="pr-6 font-normal">주</th>
            <th className="pr-6 font-normal">실행 / 목표</th>
            <th className="font-normal">달성률</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {weeks.map((w) => (
            <tr key={w.weekStart}>
              <td className="pr-6">{md(parseISODate(w.weekStart))} 주</td>
              <td className="pr-6">
                {w.progress.done}/{w.progress.total}회
              </td>
              <td>{w.progress.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
