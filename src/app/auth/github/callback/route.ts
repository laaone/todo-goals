import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, connection, type NextRequest } from "next/server";
import { STATE_COOKIE, callbackUrl, exchangeCode, fetchGithubUser } from "@/lib/server/github";
import { claimAnonymousData } from "@/lib/server/repo";
import { createSession, destroySession, upsertGithubUser } from "@/lib/server/session";
import { takeAnonymousId } from "@/lib/server/user";

const sameString = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * GitHub 콜백: state 확인 → code를 토큰으로 교환 → 사용자 정보 저장 → 세션 생성.
 * 같은 브라우저에 로그인 전 익명 데이터가 있으면 로그인한 사용자에게 옮긴다.
 */
export async function GET(request: NextRequest) {
  await connection(); // 요청 시점에만 실행
  const fail = (reason: string) => NextResponse.redirect(new URL(`/login?error=${reason}`, request.url));
  const params = request.nextUrl.searchParams;
  const store = await cookies();
  const expected = store.get(STATE_COOKIE)?.value;
  store.delete({ name: STATE_COOKIE, path: "/auth/github" });

  if (params.get("error")) return fail("denied"); // 사용자가 GitHub 화면에서 거부
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state || !expected || !sameString(state, expected)) return fail("state");

  try {
    const token = await exchangeCode(code, callbackUrl(request.url));
    const ghUser = await fetchGithubUser(token);
    const userId = await upsertGithubUser(ghUser);

    const anonId = await takeAnonymousId();
    if (anonId) await claimAnonymousData(anonId, userId);

    await destroySession(); // 로그아웃 없이 다시 로그인했으면 이전 세션 문서를 남기지 않는다
    await createSession(userId);
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("[auth/github/callback]", error);
    return fail("github");
  }
}
