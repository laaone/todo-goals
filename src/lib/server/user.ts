import { cookies } from "next/headers";

/** 로그인 기능 이전에 브라우저별로 발급하던 익명 ID 쿠키 */
const ANON_COOKIE = "todo_uid";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 예전 익명 ID를 읽고 쿠키를 지운다. 로그인 콜백에서 그 ID의 데이터를 로그인 사용자에게 옮길 때 쓴다.
 * Route Handler에서만 호출 (쿠키 쓰기).
 */
export async function takeAnonymousId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(ANON_COOKIE)?.value;
  if (value === undefined) return null;
  store.delete(ANON_COOKIE);
  return UUID.test(value) ? value : null;
}
