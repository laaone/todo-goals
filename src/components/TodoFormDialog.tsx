"use client";

import { useState, type FormEvent } from "react";
import { addTodo, updateTodo, weeklyGoalsOf } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import type { DayIndex, Priority, Todo } from "@/lib/types";
import { DAY_LABELS } from "@/lib/week";
import { Modal, inputCls, primaryBtn, secondaryBtn } from "./ui";

interface Props {
  weekStart: string;
  /** 있으면 수정, 없으면 생성 */
  todo?: Todo;
  defaultDay?: DayIndex | null;
  onClose: () => void;
}

export function TodoFormDialog({ weekStart, todo, defaultDay = null, onClose }: Props) {
  const data = useAppStore((s) => s.data);
  const apply = useAppStore((s) => s.apply);
  const weeklyGoals = weeklyGoalsOf(data, weekStart);

  const [title, setTitle] = useState(todo?.title ?? "");
  const [description, setDescription] = useState(todo?.description ?? "");
  const [day, setDay] = useState<string>(String(todo ? (todo.day ?? "") : (defaultDay ?? "")));
  const [weeklyGoalId, setWeeklyGoalId] = useState(todo?.weeklyGoalId ?? "");
  const [priority, setPriority] = useState<string>(todo?.priority ?? "");
  const [dueDate, setDueDate] = useState(todo?.dueDate ?? "");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const fields = {
      title: title.trim(),
      description,
      day: day === "" ? null : (Number(day) as DayIndex),
      weeklyGoalId: weeklyGoalId || null,
      priority: (priority || null) as Priority | null,
      dueDate: dueDate || null,
    };
    apply((d) => (todo ? updateTodo(d, todo.id, fields) : addTodo(d, { ...fields, weekStart })));
    onClose();
  }

  return (
    <Modal title={todo ? "할 일 수정" : "새 할 일"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-80">
          제목
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-80">
          설명
          <textarea
            className={inputCls}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-80">
            요일
            <select className={inputCls} value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="">미지정</option>
              {DAY_LABELS.map((l, i) => (
                <option key={l} value={i}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-80">
            우선순위
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">없음</option>
              <option value="high">높음</option>
              <option value="medium">보통</option>
              <option value="low">낮음</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-80">
          주간 목표
          <select
            className={inputCls}
            value={weeklyGoalId}
            onChange={(e) => setWeeklyGoalId(e.target.value)}
          >
            <option value="">연결 안 함</option>
            {weeklyGoals.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>
          {weeklyGoals.length === 0 && (
            <span className="text-sm font-normal text-muted">이 주에는 주간 목표가 없습니다. 주간 계획에서 추가하세요.</span>
          )}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-80">
          마감일
          <input
            type="date"
            className={inputCls}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
        <div className="flex justify-end gap-3 border-t border-hairline pt-5">
          <button type="button" className={secondaryBtn} onClick={onClose}>
            취소
          </button>
          <button type="submit" className={primaryBtn} disabled={!title.trim()}>
            {todo ? "저장" : "추가"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
