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

export function Nav() {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-3">
        <span className="mr-3 shrink-0 font-bold text-zinc-900">목표 → 할 일</span>
        {/* 로그인 화면에서는 앱 메뉴·저장 상태·사용자 메뉴를 숨긴다 */}
        {!isLogin && (
          <>
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${
                    active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <span className="ml-auto shrink-0 pl-2">
              <SyncStatus />
            </span>
            <UserMenu />
          </>
        )}
      </nav>
    </header>
  );
}
