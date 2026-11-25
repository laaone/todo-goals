import { Suspense } from "react";
import { LoginError } from "./LoginError";

export const metadata = { title: "로그인 · 목표 → 할 일" };

export default function LoginPage() {
  return (
    <div className="mx-auto mt-16 max-w-sm rounded-xl border border-zinc-200 bg-white p-8 text-center">
      <h1 className="mb-2 text-xl font-bold">목표 → 할 일</h1>
      <p className="mb-6 text-sm text-zinc-600">
        1년 목표, 주간 계획, 오늘의 할 일을 한 줄로 잇습니다.
        <br />
        계속하려면 로그인하세요.
      </p>
      <Suspense>
        <LoginError />
      </Suspense>
      {/* Route Handler로 가는 링크라 일반 <a>를 쓴다 (클라이언트 내비게이션 대상이 아님) */}
      <a
        href="/auth/github"
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
      >
        <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        GitHub로 로그인
      </a>
    </div>
  );
}
