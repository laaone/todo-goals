import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, connection, type NextRequest } from "next/server";
import { STATE_COOKIE, appOrigin, authorizeUrl, callbackUrl } from "@/lib/server/github";

/** GitHub 로그인 시작: CSRF 방지용 state를 쿠키에 저장하고 GitHub 인증 화면으로 보낸다 */
export async function GET(request: NextRequest) {
  await connection(); // 요청 시점에만 실행 (빌드 시 미리 렌더링하지 않음)
  try {
    // 정식 주소가 아닌 곳(Vercel 배포별 주소 등)으로 들어왔으면 정식 주소에서 다시 시작한다.
    // 그래야 state 쿠키와 콜백이 같은 도메인에 있고, GitHub에 등록된 콜백 주소와 일치한다.
    const origin = appOrigin(request.url);
    if (origin !== request.nextUrl.origin) {
      return NextResponse.redirect(new URL("/auth/github", origin));
    }

    const state = randomBytes(16).toString("hex");
    (await cookies()).set(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/auth/github",
      maxAge: 10 * 60,
    });
    return NextResponse.redirect(authorizeUrl(state, callbackUrl(request.url)));
  } catch (error) {
    console.error("[auth/github]", error);
    return NextResponse.redirect(new URL("/login?error=config", request.url));
  }
}
