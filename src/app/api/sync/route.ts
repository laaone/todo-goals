import { applySync } from "@/lib/server/repo";
import { getSessionUser } from "@/lib/server/session";
import { validatePayload } from "@/lib/validate";

/** 클라이언트가 보낸 변경분(upsert/delete)을 로그인한 사용자 소유로 반영. 로그인하지 않았으면 401 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });

    // JSON만 받는다. 다른 사이트의 text/plain 폼 전송으로 요청을 위조하는 것을 막는다 (SameSite 쿠키에 더한 방어)
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return Response.json({ error: "Content-Type은 application/json이어야 합니다." }, { status: 415 });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "잘못된 JSON입니다." }, { status: 400 });
    }
    const payload = validatePayload(body);
    if (!payload) return Response.json({ error: "잘못된 데이터입니다." }, { status: 400 });

    await applySync(user.userId, payload);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/sync]", error);
    return Response.json({ error: "저장하지 못했습니다." }, { status: 500 });
  }
}
