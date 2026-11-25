import { NextResponse, type NextRequest } from "next/server";

/** session.ts의 SESSION_COOKIE와 같은 값. proxy는 서버 모듈을 공유하지 않으므로 따로 둔다 */
const SESSION_COOKIE = "todo_session";

/**
 * 로그인하지 않은 사용자가 앱 화면에 오면 /login으로 보낸다.
 * 여기서는 쿠키가 있는지만 빠르게 본다. 세션이 실제로 유효한지는 API가 DB로 확인하고
 * 무효면 401 → 클라이언트가 /login으로 보낸다.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/week", "/goals"],
};
