# 할 일 관리 앱 — 작업 계획

> 상태: **구현 완료** (2026-11-25 · P0 + P1, 단위 테스트 17개 + 브라우저 시나리오 18개 통과)
> 근거 문서: `docs/PRD.md`
> 작성일: 2026-11-25

## 1. 요구사항 요약

| 항목 | 결정 |
|---|---|
| 스택 | Next.js (App Router) + TypeScript + Tailwind CSS (linknamu와 동일 계열) |
| 저장소 | 브라우저 `localStorage` (서버·로그인 없음, 단일 기기) |
| 범위 | **Phase 1 = P0** 완성·검증 후 **Phase 2 = P1** 추가 |
| 화면 구성 | 3열 칸반(todo/doing/done) + 상단 요일 탭(전체/월~일) 필터 |

연결 구조(PRD L39-40): **할 일 → 주간 목표 → 1년 목표**

## 2. 데이터 모델 (`src/lib/types.ts`)

```ts
type Status = 'todo' | 'doing' | 'done';
type Priority = 'high' | 'medium' | 'low';          // P1

interface Goal {            // 1년 목표
  id: string; title: string; description: string;
  year: number; createdAt: string;
}
interface WeeklyPlan {      // 주 단위 (월요일 시작)
  weekStart: string;        // 'YYYY-MM-DD' (해당 주 월요일, 로컬 시간 기준) — 키 역할
  memo: string;
  review?: string;          // P1 주간 회고
}
interface WeeklyGoal {      // 이번 주 목표 (주당 최대 5개)
  id: string; weekStart: string;
  goalId: string | null;    // 상위 1년 목표
  title: string; order: number;
}
interface Todo {
  id: string; title: string; description?: string;
  status: Status; order: number;          // 칸반 열 내 순서
  weekStart: string; day: 0|1|2|3|4|5|6 | null;   // 0=월, null=요일 미지정
  weeklyGoalId: string | null;            // 상위 주간 목표
  priority?: Priority; dueDate?: string;  // P1
  createdAt: string; updatedAt: string;
}
interface AppData { version: 1; goals: Goal[]; weeklyPlans: WeeklyPlan[];
                    weeklyGoals: WeeklyGoal[]; todos: Todo[]; }
```

- 저장 키: `todo-app:v1` 한 개에 `AppData` 전체를 JSON으로 저장. `version` 필드로 이후 스키마 변경 시 마이그레이션.
- 삭제 정책: 1년 목표 삭제 → 연결된 주간 목표의 `goalId`를 `null`로 (할 일은 유지). 주간 목표 삭제 → 연결된 할 일의 `weeklyGoalId`를 `null`로. 삭제 전 확인 창 표시.

## 3. 파일 구조 (생성 예정)

```
05/
├─ docs/PRD.md, docs/PLAN.md, docs/CLAUDE.md
└─ src/
   ├─ app/
   │  ├─ layout.tsx          # 공통 내비게이션 (대시보드 / 주간 계획 / 1년 목표)
   │  ├─ page.tsx            # 대시보드: 이번 주 목표 요약 + 요일 탭 + 칸반
   │  ├─ week/page.tsx       # 주간 계획: 주간 목표(≤5) 편집, 메모, (P1) 회고
   │  └─ goals/page.tsx      # 1년 목표 CRUD + 설명
   ├─ components/
   │  ├─ KanbanBoard.tsx, KanbanColumn.tsx, TodoCard.tsx
   │  ├─ TodoFormDialog.tsx  # 생성/수정 (제목, 설명, 요일, 주간 목표 선택)
   │  ├─ DayTabs.tsx, WeekNavigator.tsx (이전/다음 주)
   │  └─ ProgressBar.tsx     # P1
   └─ lib/
      ├─ types.ts
      ├─ store.ts            # Zustand + persist(localStorage) — 모든 CRUD 액션
      ├─ week.ts             # 주 시작일 계산, 요일 라벨
      └─ progress.ts         # P1 진행률 계산 (순수 함수)
```

라이브러리: `zustand`(상태+persist), `@dnd-kit/core` + `@dnd-kit/sortable`(드래그앤드랍, 터치 지원), `vitest`(로직 테스트).

## 4. 구현 단계

### Phase 0 — 셋업
1. `npx create-next-app@latest .` (TypeScript, Tailwind, App Router, `src/`), Pretendard 폰트 적용.
2. `zustand`, `@dnd-kit/core`, `@dnd-kit/sortable`, `vitest` 설치.
3. `docs/CLAUDE.md`에 프로젝트 규칙(스택, 폴더 구조, 저장 키, 테스트 명령) 기록.

### Phase 1 — P0 핵심 기능
4. `lib/types.ts`, `lib/week.ts` 작성 + `week.ts` 단위 테스트.
5. `lib/store.ts`: Goal / WeeklyPlan / WeeklyGoal / Todo CRUD, `moveTodo(id, status, index)`, 삭제 정책(§2) 구현 + 단위 테스트.
6. `/goals`: 1년 목표 생성·수정·삭제, 설명 작성.
7. `/week`: 주 이동, 이번 주 목표 생성(1년 목표 선택, **6번째 추가 시 차단**), 주간 메모(입력 시 자동 저장).
8. `/` 대시보드: 이번 주 목표 요약, 요일 탭(기본 = 오늘 요일), 칸반 3열, 할 일 생성/수정/삭제 다이얼로그.
9. 드래그앤드랍: 열 간 이동 = 상태 변경, 열 내 이동 = 순서 변경. 키보드 대안(카드 메뉴의 "상태 변경")도 제공.
10. 최초 사용 흐름(PRD L12-14): 데이터가 비어 있으면 대시보드에 "1년 목표 만들기 → 이번 주 계획 작성" 안내 표시.

### Phase 2 — P1 추가 기능
11. 할 일에 우선순위(High/Medium/Low 배지, 열 내 정렬 옵션)·마감일(지난 마감 강조) 추가.
12. `lib/progress.ts` + 테스트:
    - 주간 진행률 = 해당 주 done 할 일 수 / 해당 주 전체 할 일 수 (할 일 0개면 0%)
    - 주간 목표 진행률 = 연결된 done 할 일 / 연결된 전체 할 일
    - 1년 목표 진행률 = 그 목표에 연결된 모든 주의 할 일 기준 done 비율
13. 대시보드·`/week`·`/goals`에 `ProgressBar` 표시 — 상태 변경 즉시 갱신(스토어 파생값).
14. `/week`에 주간 회고 입력란 추가.

## 5. 수용 기준 (테스트 가능)

**P0**
- [ ] 할 일 생성 → 새로고침 후에도 유지된다 (localStorage).
- [ ] 할 일 제목·설명·요일·주간 목표를 수정할 수 있고, 삭제 시 확인 후 사라진다.
- [ ] 카드를 todo→doing→done 열로 드래그하면 `status`가 바뀌고 새로고침 후에도 유지된다.
- [ ] 요일 탭 "화"를 누르면 `day=1`인 할 일만 표시되고, "전체"는 그 주 전체를 표시한다.
- [ ] 주간 목표는 주당 5개까지 생성되고 6번째는 버튼이 비활성화된다.
- [ ] 주간 메모가 주별로 따로 저장된다 (다음 주로 이동하면 빈 메모).
- [ ] 할 일 → 주간 목표 → 1년 목표 연결이 카드/목표 화면에 표시된다.
- [ ] 1년 목표를 삭제해도 주간 목표와 할 일은 남고 연결만 해제된다.
- [ ] 첫 실행(빈 저장소) 시 안내 화면이 보인다.

**P1**
- [ ] 할 일 1/4을 done으로 옮기면 주간 진행률이 25%로 즉시 바뀐다.
- [ ] 목표별 진행률이 `progress.ts` 정의대로 표시된다 (단위 테스트 통과).
- [ ] 우선순위 배지와 마감일이 카드에 표시되고, 지난 마감일은 강조된다.
- [ ] 주간 회고가 주별로 저장된다.

**공통**
- [ ] `npm run build`, `npm run lint`, `npx vitest run` 모두 통과.
- [ ] 콘솔에 hydration 경고가 없다.
- [ ] 375px 폭(모바일)에서 칸반이 가로 스크롤 없이 쓸 수 있다 (열을 세로로 쌓거나 탭 전환).

## 6. 위험과 대응

| 위험 | 대응 |
|---|---|
| localStorage는 서버 렌더링 시 없음 → hydration 불일치 | 데이터 화면을 클라이언트 컴포넌트로 만들고, persist 복원 완료(`hasHydrated`) 전에는 스켈레톤 표시 |
| 주 경계·시간대 오류 (UTC로 계산하면 월요일이 하루 밀림) | `week.ts`에서 로컬 시간 기준으로 계산, 일요일·자정 경계 단위 테스트 |
| 데이터 손실 (브라우저 데이터 삭제, 다른 기기) | 단일 기기 한계를 UI에 명시. 후속 과제로 JSON 내보내기/가져오기 |
| 스키마 변경 시 기존 데이터 깨짐 | `version` 필드 + Zustand persist `migrate` 사용 |
| 드래그앤드랍 터치·접근성 | dnd-kit의 Pointer/Touch/Keyboard 센서 사용, 카드 메뉴로 상태 변경 대안 제공 |
| Next.js 최신 버전 API 차이 | linknamu와 같이 설치된 버전 문서(`node_modules/next/dist/docs`)를 기준으로 작성 |

## 7. 검증 단계

1. `npx vitest run` — `week.ts`, `store.ts`, `progress.ts` 단위 테스트.
2. `npm run lint && npm run build`.
3. `npm run dev` 후 수동 시나리오: 1년 목표 2개 → 이번 주 목표 3개 → 할 일 4개(요일 분산) → 드래그로 상태 변경 → 새로고침 → 요일 탭 확인 → 목표 삭제 → (P1) 진행률 확인.
4. 브라우저 DevTools 375px 폭에서 동일 시나리오.

## 8. 후속 과제 (범위 밖)

- JSON 내보내기/가져오기 백업
- 서버 저장(MongoDB) + 로그인으로 기기 간 동기화
- Vercel 배포
