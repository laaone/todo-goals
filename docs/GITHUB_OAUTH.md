# GitHub OAuth 로그인 설정

## 1. GitHub OAuth App 만들기

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
   (바로가기: https://github.com/settings/applications/new)
2. 입력값

   | 항목 | 개발(로컬) | 배포 |
   |---|---|---|
   | Application name | 아무 이름 (예: 목표 → 할 일 dev) | 서비스 이름 |
   | Homepage URL | `http://localhost:3000` | `https://<도메인>` |
   | Authorization callback URL | `http://localhost:3000/auth/github/callback` | `https://<도메인>/auth/github/callback` |

3. **Register application** → 화면의 **Client ID**를 복사
4. **Generate a new client secret** → 생성된 시크릿을 바로 복사 (다시 볼 수 없음)

> OAuth App 하나에는 콜백 URL을 하나만 등록할 수 있습니다. 로컬과 배포용 앱을 따로 만드세요.

## 2. 환경 변수

`.env.example`을 `.env`로 복사하고 값을 채웁니다.

```
MONGODB_URI=mongodb+srv://...
GITHUB_CLIENT_ID=<Client ID>
GITHUB_CLIENT_SECRET=<Client secret>
# 배포 시
APP_URL=https://<도메인>
```

- 시크릿은 **코드에 쓰지 말고** `.env`(로컬) 또는 호스팅 서비스의 환경 변수(배포)에만 넣습니다.
- 콜백 주소의 기준이 되는 "정식 주소"는 `APP_URL` → (Vercel production이면) Vercel이 자동으로 넣는 `VERCEL_PROJECT_PRODUCTION_URL` → 요청이 들어온 주소 순으로 정합니다. Vercel에서는 `APP_URL` 없이도 정식 도메인이 쓰입니다.
- 정식 주소가 아닌 곳(배포별 주소 `todo-goals-xxxx.vercel.app`, `…-git-master-…` 등)에서 로그인을 누르면 정식 주소로 이동한 뒤 GitHub 로그인을 시작합니다.

## 3. 데이터 마이그레이션 (기존 데이터가 있을 때)

로그인 기능 전에는 데이터의 소유자 필드가 `userId`(브라우저별 익명 ID)였습니다. 이제는 `user_id`(로그인 사용자 `users._id`)입니다.

```
npm run migrate
```

- 4개 컬렉션(`goals`, `weeklyPlans`, `weeklyGoals`, `todos`)의 `userId` → `user_id`로 이름을 바꾸고, 인덱스를 `(user_id, id)` / `(user_id, weekStart)`로 교체합니다.
- 여러 번 실행해도 안전합니다. 서버도 처음 DB에 연결할 때 같은 작업을 자동으로 합니다.
- 예전에 쓰던 브라우저로 처음 로그인하면, 그 브라우저의 익명 데이터가 로그인한 계정으로 옮겨집니다.
  - 브라우저 단위로 동작하므로, 여러 사람이 같은 브라우저를 썼다면 **그 브라우저에서 처음 로그인한 계정**이 데이터를 가져갑니다. (localStorage에만 저장하던 초기 버전의 데이터도 같습니다: 서버 데이터가 비어 있는 첫 계정에 올라갑니다.)

## 4. 동작 방식

| 경로 | 설명 |
|---|---|
| `GET /auth/github` | CSRF 방지용 `state`를 쿠키에 저장하고 GitHub 인증 화면으로 이동 |
| `GET /auth/github/callback` | `state` 확인 → code를 access token으로 교환 → GitHub 사용자 조회 → `users`에 `username`, `avatar_url` 저장 → 세션 생성 |
| `POST /auth/logout` | `sessions` 문서와 세션 쿠키를 삭제 |

- 세션: 무작위 토큰을 httpOnly 쿠키 `todo_session`에 두고, DB(`sessions`)에는 토큰의 SHA-256 해시만 저장합니다. 30일 뒤 만료되며 만료된 문서는 MongoDB TTL 인덱스가 지웁니다.
- 로그인하지 않으면 `/`, `/week`, `/goals`는 `/login`으로 이동하고, `/api/data`, `/api/sync`, `/api/me`는 401을 반환합니다.
- GitHub access token은 사용자 정보를 한 번 읽는 데만 쓰고 저장하지 않습니다.
