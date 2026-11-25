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
    <div className="flex shrink-0 items-center gap-2">
      {me.avatar_url && (
        <Image
          src={me.avatar_url}
          alt=""
          width={24}
          height={24}
          className="rounded-full"
          unoptimized
        />
      )}
      <span className="hidden text-sm text-zinc-700 sm:inline" data-testid="username">
        {me.username}
      </span>
      <form action="/auth/logout" method="post">
        <button type="submit" className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100">
          로그아웃
        </button>
      </form>
    </div>
  );
}
