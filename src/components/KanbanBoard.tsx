"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { deleteTodo, moveTodo } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { STATUSES, type Priority, type Status, type Todo } from "@/lib/types";
import { DAY_LABELS, todayISO } from "@/lib/week";
import { dangerTextBtn, textBtn } from "./ui";

const STATUS_LABEL: Record<Status, string> = { todo: "할 일", doing: "진행 중", done: "완료" };
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const PRIORITY_LABEL: Record<Priority, string> = { high: "높음", medium: "보통", low: "낮음" };
// 포인트 색은 "높음"에만 쓰고 나머지는 회색 단계로 구분한다
const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-[#fff0f3] text-primary-active",
  medium: "bg-surface-strong text-ink",
  low: "bg-surface-soft text-muted",
};
const chip = "rounded-full px-2.5 py-0.5 text-[13px]";
const COL_PREFIX = "col:";

/**
 * 포인터가 올라간 곳을 우선한다: 카드 > 열. 포인터가 아무 데도 없을 때(키보드 등)만 모서리 거리로 판단.
 * closestCorners만 쓰면 포인터는 "진행 중" 위인데 카드 몸통이 옆 열 카드에 더 가까워 엉뚱한 열로 들어간다.
 */
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  if (hits.length) {
    const card = hits.find((h) => !String(h.id).startsWith(COL_PREFIX));
    return [card ?? hits[0]];
  }
  return closestCorners(args);
};

interface Props {
  todos: Todo[];
  sortByPriority: boolean;
  onEdit: (todo: Todo) => void;
}

export function KanbanBoard({ todos, sortByPriority, onEdit }: Props) {
  const apply = useAppStore((s) => s.apply);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columns = Object.fromEntries(
    STATUSES.map((s) => {
      const list = todos.filter((t) => t.status === s);
      list.sort((a, b) =>
        sortByPriority
          ? rank(a) - rank(b) || a.order - b.order
          : a.order - b.order,
      );
      return [s, list];
    }),
  ) as Record<Status, Todo[]>;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || overId === id) return;
    const active = todos.find((t) => t.id === id);
    if (!active) return;

    // 열 빈 공간에 놓음 → 그 열 맨 끝
    if (overId.startsWith(COL_PREFIX)) {
      const status = overId.slice(COL_PREFIX.length) as Status;
      if (status !== active.status) apply((d) => moveTodo(d, id, status, null));
      return;
    }

    const over = todos.find((t) => t.id === overId);
    if (!over) return;
    const col = columns[over.status];
    if (over.status === active.status) {
      // 같은 열 안에서 순서 변경
      const from = col.findIndex((t) => t.id === id);
      const to = col.findIndex((t) => t.id === overId);
      const reordered = arrayMove(col, from, to);
      const next = reordered[to + 1]?.id ?? null;
      apply((d) => moveTodo(d, id, over.status, next));
    } else {
      // 다른 열 카드 위에 놓음 → 그 카드 앞
      apply((d) => moveTodo(d, id, over.status, overId));
    }
  }

  const activeTodo = activeId ? todos.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STATUSES.map((s) => (
          <Column key={s} status={s} todos={columns[s]} onEdit={onEdit} disabled={sortByPriority} />
        ))}
      </div>
      <DragOverlay>{activeTodo ? <CardBody todo={activeTodo} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function rank(t: Todo) {
  return t.priority ? PRIORITY_RANK[t.priority] : 3;
}

function Column({
  status,
  todos,
  onEdit,
  disabled,
}: {
  status: Status;
  todos: Todo[];
  onEdit: (t: Todo) => void;
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: COL_PREFIX + status });
  return (
    <section
      ref={setNodeRef}
      aria-label={STATUS_LABEL[status]}
      className={`flex min-h-48 flex-col rounded-card border p-3 transition-colors ${
        isOver ? "border-ink bg-surface-strong" : "border-transparent bg-surface-soft"
      }`}
    >
      <h3 className="mb-3 flex items-center gap-2 px-1 text-base font-semibold text-ink">
        {STATUS_LABEL[status]}
        <span className="text-sm font-medium text-muted tabular-nums">{todos.length}</span>
      </h3>
      <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-1 flex-col gap-3">
          {todos.map((t) => (
            <SortableCard key={t.id} todo={t} onEdit={onEdit} reorderDisabled={disabled} />
          ))}
          {todos.length === 0 && (
            <li className="rounded-card border border-dashed border-hairline py-8 text-center text-sm text-muted-soft">
              여기로 끌어다 놓으세요
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  );
}

function SortableCard({
  todo,
  onEdit,
  reorderDisabled,
}: {
  todo: Todo;
  onEdit: (t: Todo) => void;
  reorderDisabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: reorderDisabled ? undefined : CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "opacity-40" : ""}
      {...attributes}
      {...listeners}
      aria-label={`${todo.title} (끌어서 상태 변경)`}
    >
      <CardBody todo={todo} onEdit={onEdit} />
    </li>
  );
}

function CardBody({
  todo,
  onEdit,
  dragging,
}: {
  todo: Todo;
  onEdit?: (t: Todo) => void;
  dragging?: boolean;
}) {
  const data = useAppStore((s) => s.data);
  const apply = useAppStore((s) => s.apply);
  const wg = todo.weeklyGoalId ? data.weeklyGoals.find((w) => w.id === todo.weeklyGoalId) : null;
  const goal = wg?.goalId ? data.goals.find((g) => g.id === wg.goalId) : null;
  const overdue = !!todo.dueDate && todo.status !== "done" && todo.dueDate < todayISO();

  // 카드 안 버튼/셀렉트에서는 드래그가 시작되지 않게 한다
  const stop = {
    onPointerDown: (e: PointerEvent) => e.stopPropagation(),
    onKeyDown: (e: KeyboardEvent) => e.stopPropagation(),
  };

  return (
    <div
      className={`cursor-grab rounded-card border border-hairline bg-canvas p-4 transition-shadow hover:shadow-float active:cursor-grabbing ${
        dragging ? "rotate-1 shadow-float" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-base font-semibold ${todo.status === "done" ? "text-muted-soft line-through" : "text-ink"}`}>
          {todo.title}
        </p>
        {todo.priority && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLE[todo.priority]}`}>
            {PRIORITY_LABEL[todo.priority]}
          </span>
        )}
      </div>
      {todo.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{todo.description}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {todo.day !== null && (
          <span className={`${chip} bg-surface-soft text-body`}>{DAY_LABELS[todo.day]}요일</span>
        )}
        {todo.dueDate && (
          <span className={`${chip} ${overdue ? "bg-[#fff0ee] font-semibold text-error" : "bg-surface-soft text-body"}`}>
            {overdue ? "마감 지남 " : "마감 "}
            {todo.dueDate.slice(5).replace("-", "/")}
          </span>
        )}
        {wg && (
          <span className={`${chip} border border-hairline text-body`} title="주간 목표 → 1년 목표">
            {wg.title}
            {goal && <span className="text-muted"> → {goal.title}</span>}
          </span>
        )}
      </div>
      {!dragging && onEdit && (
        <div className="mt-3 flex items-center gap-1 border-t border-hairline-soft pt-3" {...stop}>
          <select
            aria-label="상태 변경"
            className="rounded-full border border-hairline bg-canvas px-3 py-1 text-sm text-ink focus:border-ink focus:outline-none"
            value={todo.status}
            onChange={(e) => apply((d) => moveTodo(d, todo.id, e.target.value as Status, null))}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button className={`ml-auto ${textBtn}`} onClick={() => onEdit(todo)}>
            수정
          </button>
          <button
            className={dangerTextBtn}
            onClick={() => {
              if (confirm(`"${todo.title}" 할 일을 삭제할까요?`)) apply((d) => deleteTodo(d, todo.id));
            }}
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
