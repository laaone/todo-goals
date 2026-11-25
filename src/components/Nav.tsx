"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SyncStatus } from "./SyncStatus";
import { UserMenu } from "./UserMenu";

const LINKS = [
  { href: "/", label: "대시보드" },
  { href: "/week", label: "주간 계획" },
  { href: "/goals", label: "1년 목표" },
] as const;

/** 상단 바: 흰 바탕 + 아래 1px 선. 왼쪽 로고, 가운데 메뉴(활성은 2px 밑줄), 오른쪽 계정 */
export function Nav() {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  return (
    <header className="sticky top-0 z-10 border-b border-hairline bg-canvas">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:h-20 sm:px-6 lg:px-10">
        {/* 로그인 화면이 아니면 좁은 화면에서는 메뉴 3개가 들어가도록 로고를 숨긴다 */}
        <Link href="/" className={`${isLogin ? "flex" : "hidden sm:flex"} shrink-0 items-center gap-2 text-ink`}>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
            ✓
          </span>
          <span className="hidden text-lg font-bold sm:inline">목표 → 할 일</span>
        </Link>

        {!isLogin && (
          <>
            {/* 좁은 화면에서 가운데 정렬 + 가로 스크롤이면 왼쪽이 잘리므로 왼쪽 정렬 */}
            <nav className="flex min-w-0 flex-1 justify-start gap-1 overflow-x-auto sm:justify-center sm:gap-6" aria-label="주 메뉴">
              {LINKS.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`shrink-0 border-b-2 px-1.5 py-2 text-[15px] font-semibold transition-colors sm:px-2 sm:text-base ${
                      active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex shrink-0 items-center gap-3">
              <SyncStatus />
              <UserMenu />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
