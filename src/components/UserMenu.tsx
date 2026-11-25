"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface Me {
  username: string;
  avatar_url: string;
}

/** 상단 바의 GitHub 아바타 · username · 로그아웃 */
export function UserMenu() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Me>) : null))
      .then((m) => alive && setMe(m))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!me) return null;
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      {me.avatar_url && (
        <Image src={me.avatar_url} alt="" width={24} height={24} className="rounded-full" unoptimized />
      )}
      <span className="hidden text-[13px] text-on-dark/85 sm:inline" data-testid="username">
        {me.username}
      </span>
      <form action="/auth/logout" method="post">
        <button
          type="submit"
          className="flex items-center rounded-util text-[13px] text-on-dark/75 hover:text-on-dark focus-visible:outline-2 focus-visible:outline-primary-focus"
          aria-label="로그아웃"
        >
          {/* 좁은 화면에서는 아이콘만 */}
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="sm:hidden">
            <path d="M6 2.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H6M10.5 11 13.5 8l-3-3M13.5 8H6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">로그아웃</span>
        </button>
      </form>
    </div>
  );
}
