# 할 일 관리 앱 — 프로젝트 규칙

요구사항은 `docs/PRD.md`, 구현 계획은 `docs/PLAN.md`를 본다.

## 스택
- Next.js 16 (App Router, `src/`) + TypeScript + Tailwind CSS 4, 폰트는 Pretendard
- 저장: MongoDB (`.env`의 `MONGODB_URI`, DB 이름은 `MONGODB_DB` 또는 기본값 `todo_goals`). 컬렉션 `goals`, `weeklyPlans`, `weeklyGoals`, `todos`
- 인증: GitHub OAuth (설정은 `docs/GITHUB_OAUTH.md`, 환경 변수는 `.env.example`). 사용자는 `users`(githubId, username, avatar_url), 세션은 `sessions`(토큰 SHA-256 해시, 30일 TTL), 쿠키 `todo_session`(httpOnly)
- 소유자: 모든 데이터 문서에 `user_id`(= `users._id` 문자열). **모든 조회/쓰기 쿼리에 세션의 `user_id`를 건다**. 클라이언트가 보낸 값은 쓰지 않는다
- 예전 익명 쿠키 `todo_uid`는 이제 발급하지 않는다. 로그인 콜백에서 그 브라우저의 익명 데이터를 로그인 사용자에게 옮기고 쿠키를 지운다 (`src/lib/server/user.ts`, `repo.ts`의 `claimAnonymousData`)
- 클라이언트 상태: Zustand (화면은 즉시 갱신하고 서버 저장은 400ms 모아서 보냄)
- 드래그앤드랍: `@dnd-kit/core` + `@dnd-kit/sortable`
- 테스트: Vitest (`src/lib/*.test.ts`)
- Next.js 16은 학습 데이터와 API가 다를 수 있다. 코드를 쓰기 전 `node_modules/next/dist/docs/`를 확인한다 (`AGENTS.md`).

## 명령
- `npm run dev` / `npm run build` / `npm run lint` / `npm test`
- `npm run migrate`: 스키마 마이그레이션 (`userId` → `user_id`, 인덱스 교체). 여러 번 실행해도 안전하고, 서버도 첫 DB 연결 때 자동 실행한다

## 구조와 규칙
- `src/lib/data.ts`: AppData를 다루는 **순수 함수**만 둔다 (입력 불변, 새 객체 반환). 새 데이터 동작은 여기에 추가하고 `data.test.ts`에 테스트를 붙인다.
- `src/lib/store.ts`
  - `useAppStore`: 저장되는 데이터. 변경은 `apply((d) => someDataFn(d, ...))`로만 한다. 직접 `set`하지 않는다.
  - 저장 방식: 서버가 마지막으로 확인한 데이터(`confirmed`)와 현재 데이터의 차이를 `diffData`(`src/lib/sync.ts`)로 구해 `POST /api/sync`로 보낸다. 바뀌지 않은 항목은 참조가 그대로라는 `data.ts`의 성질에 기대므로, **data.ts 함수는 바뀌지 않은 항목을 새로 복사하면 안 된다**.
  - 저장 실패 시 `confirmed`를 유지하므로 다음 저장이나 "다시 시도"가 실패분까지 다시 보낸다. 탭을 숨기면 `keepalive`로 바로 보낸다.
  - `useViewStore`: 저장하지 않는 화면 상태(보는 주).
  - 불러오기는 `StoreHydrator`가 마운트 후 `GET /api/data`로 한다. 페이지는 `useHydrated()`가 true가 되기 전까지 `<Skeleton />`을 보여준다.
  - 서버가 비어 있고 예전 localStorage 키 `todo-app:v1`에 데이터가 있으면 처음 한 번 서버로 옮기고 키를 지운다.
- 서버 코드는 `src/lib/server/` (MongoDB 연결 `mongodb.ts`, 마이그레이션 `migrate.ts`, 읽기/쓰기 `repo.ts`, 세션 `session.ts`, GitHub `github.ts`). API는 `src/app/api/{data,sync,me}`, 인증 라우트는 `src/app/auth/{github,github/callback,logout}`.
- 접근 제어: `src/proxy.ts`는 `/`, `/week`, `/goals`에서 세션 쿠키 **존재**만 보고 `/login`으로 보낸다. 실제 세션 검증은 API가 DB로 하고 401 → 클라이언트가 `/login`으로 이동. 새 화면을 만들면 proxy `matcher`에 추가한다.
- GET Route Handler는 첫 줄에 `await connection()`을 둔다. 없으면 Next 16이 빌드 때 미리 렌더링하려다 `cookies()`에서 멈추고, `try/catch`가 그 신호를 삼킨다.
- `/api/sync`는 `Content-Type: application/json`만 받는다 (CSRF 방어).
- 서버로 들어오는 데이터는 `src/lib/validate.ts`로 필드·타입을 검사하고 허용된 필드만 남긴다. 엔티티 필드를 추가하면 여기도 고친다.
- 현재 시각(`new Date()`, `getWeekStart()`)은 렌더 중 데이터 로드 확인 **이후에만** 읽는다. 그 전에 읽으면 Next 16 프리렌더가 빌드를 실패시킨다.
- 주는 월요일 시작, 날짜는 로컬 시간 `YYYY-MM-DD` (`src/lib/week.ts`). `toISOString()`은 UTC라 쓰지 않는다.
- 연결 구조: 할 일 → 주간 목표(주당 최대 5개) → 1년 목표. 상위 항목을 지우면 하위 항목은 남기고 연결만 `null`로 끊는다.
- 진행률(`src/lib/progress.ts`): 할 일 진행률 = 완료한 할 일 / 그 주 할 일. 주간 목표 달성률 = 체크 수 / 목표 횟수(넘쳐도 100%). 주간 목표 전체 = 목표별로 목표 횟수까지만 센 체크 합 / 목표 횟수 합. 1년 목표 실행 기록(`goalActivity`) = 연결된 주간 목표들의 체크를 날짜·주별로 모은 것.
- 주간 목표는 `target`(주 1~7회, 기본 3)과 `checks`(체크한 요일, 하루 한 번)를 가진다. 이 필드가 없는 예전 데이터는 불러올 때 `normalizeData`가 1회 목표·체크 없음으로 맞춘다.
- 칸반 충돌 판정은 포인터 위치 우선(`KanbanBoard.tsx`의 `collisionDetection`). `closestCorners`만 쓰면 옆 열로 잘못 들어간다.
- 디자인은 `docs/Apple DESIGN.md`를 따른다. 색은 `src/app/globals.css` 토큰만 쓴다(`bg-canvas`/`bg-parchment`/`bg-tile`, `text-ink`/`text-muted`, `bg-primary` 등). 클릭할 수 있는 요소만 파랑(primary), 두 번째 강조색 금지, 카드·버튼·글자에 그림자 금지, 글자 굵기 400/600/700만(500 금지), 본문 17px. 화면은 `PageHeader` + 가로 전체 `Tile`(light/parchment/dark를 번갈아)로 구성한다. 버튼·입력 클래스는 `src/components/styles.ts`에서 가져온다(서버 컴포넌트도 import 가능). `docs/DESIGN.md`(이전 디자인)는 참고용으로만 남아 있다.
- 가로 스크롤 영역 안에 `sr-only` 같은 절대 위치 요소를 두면, 스크롤 영역이나 그 칸에 `relative`가 없을 때 페이지 폭이 늘어난다.
