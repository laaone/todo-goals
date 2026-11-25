import { createHash, randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { getDb } from "./mongodb";

export const SESSION_COOKIE = "todo_session";
const SESSION_DAYS = 30;

export interface SessionUser {
  /** users._id (16진수 문자열). 데이터 문서의 user_id와 같다 */
  userId: string;
  username: string;
  avatar_url: string;
}

/** DB에는 토큰 원문이 아닌 해시만 저장한다 (DB가 유출돼도 세션을 가로챌 수 없게) */
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** 세션을 만들고 쿠키를 설정한다. Route Handler에서만 호출 */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const db = await getDb();
  await db.collection("sessions").insertOne({
    tokenHash: hash(token),
    user_id: userId,
    createdAt: new Date(),
    expiresAt,
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** 현재 요청의 로그인 사용자. 세션이 없거나 만료됐으면 null */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const session = await db
    .collection("sessions")
    .findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(String(session.user_id)) });
  if (!user) return null;
  return { userId: user._id.toHexString(), username: user.username, avatar_url: user.avatar_url };
}

/**
 * 로그아웃: 세션 쿠키와 DB의 세션 문서를 모두 지운다.
 * 쿠키를 먼저 지워서, DB 오류가 나도 이 브라우저는 로그아웃 상태가 된다.
 */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  store.delete(SESSION_COOKIE);
  if (token) {
    const db = await getDb();
    await db.collection("sessions").deleteOne({ tokenHash: hash(token) });
  }
}

/** GitHub 사용자 정보를 users에 저장(있으면 갱신)하고 users._id를 돌려준다 */
export async function upsertGithubUser(gh: {
  id: number;
  login: string;
  avatar_url: string;
}): Promise<string> {
  const db = await getDb();
  const now = new Date();
  const user = await db.collection("users").findOneAndUpdate(
    { githubId: gh.id },
    {
      $set: { username: gh.login, avatar_url: gh.avatar_url, updatedAt: now },
      $setOnInsert: { githubId: gh.id, createdAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (!user) throw new Error("사용자를 저장하지 못했습니다.");
  return user._id.toHexString();
}
