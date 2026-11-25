import { NextResponse, type NextRequest } from "next/server";
import { destroySession } from "@/lib/server/session";

/** 로그아웃: DB 세션 문서와 세션 쿠키를 지우고 로그인 화면으로 보낸다 (POST 폼으로만 호출) */
export async function POST(request: NextRequest) {
  try {
    await destroySession();
  } catch (error) {
    console.error("[auth/logout]", error);
  }
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
