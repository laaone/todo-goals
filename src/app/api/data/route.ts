import { connection } from "next/server";
import { loadData } from "@/lib/server/repo";
import { getSessionUser } from "@/lib/server/session";

/** 로그인한 사용자의 전체 데이터. 로그인하지 않았으면 401 */
export async function GET() {
  await connection(); // 요청 시점에만 실행 (빌드 시 미리 렌더링하지 않음)
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    const data = await loadData(user.userId);
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/data]", error);
    return Response.json({ error: "데이터를 불러오지 못했습니다." }, { status: 500 });
  }
}
