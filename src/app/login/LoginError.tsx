"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  denied: "GitHub에서 로그인을 취소했습니다.",
  state: "로그인 요청이 만료되었거나 올바르지 않습니다. 다시 시도해 주세요.",
  github: "GitHub 로그인 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.",
  config: "서버의 GitHub 로그인 설정이 없습니다. 관리자에게 문의하세요.",
};

export function LoginError() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  return (
    <p role="alert" className="mb-4 rounded-md bg-red-50 p-2 text-sm text-red-700">
      {MESSAGES[error] ?? "로그인하지 못했습니다."}
    </p>
  );
}
