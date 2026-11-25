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

/** 전역 상단 바: 얇은(44px) 검정 바, 조용한 흰 글자 */
export function Nav() {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  return (
    <header className="sticky top-0 z-30 bg-night/90 text-on-dark backdrop-blur-md">
      <div className="mx-auto flex h-11 max-w-[1080px] items-center gap-5 px-5 sm:px-8">
        <Link
          href="/"
          className={`${isLogin ? "flex" : "hidden sm:flex"} shrink-0 items-center gap-1.5 text-[13px] font-semibold text-on-dark`}
        >
          <span aria-hidden="true" className="text-primary-on-dark">
            ◎
          </span>
          목표 → 할 일
        </Link>

        {!isLogin && (
          <>
            <nav className="flex min-w-0 flex-1 gap-5 overflow-x-auto sm:justify-center sm:gap-8" aria-label="주 메뉴">
              {LINKS.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`shrink-0 py-3 text-[13px] transition-colors ${
                      active ? "font-semibold text-on-dark" : "text-on-dark/75 hover:text-on-dark"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex shrink-0 items-center gap-4">
              <SyncStatus />
              <UserMenu />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
