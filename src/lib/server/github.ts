/**
 * GitHub OAuth (웹 애플리케이션 흐름).
 * 클라이언트 ID/시크릿은 환경 변수에서만 읽는다. 소스에 넣지 않는다.
 * GITHUB_OAUTH_URL / GITHUB_API_URL은 테스트용 목(mock) 서버를 가리킬 때만 쓴다 (기본값은 실제 GitHub).
 */
/** 로그인 시작 시 발급하는 CSRF 방지용 state 쿠키 (path=/auth/github) */
export const STATE_COOKIE = "gh_oauth_state";

export interface GithubUser {
  id: number;
  login: string;
  avatar_url: string;
}

const oauthBase = () => process.env.GITHUB_OAUTH_URL || "https://github.com";
const apiBase = () => process.env.GITHUB_API_URL || "https://api.github.com";

function credentials() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET 환경 변수가 없습니다. docs/GITHUB_OAUTH.md를 보세요.");
  }
  return { clientId, clientSecret };
}

/** GitHub 콜백 주소. APP_URL이 있으면 그것을, 없으면 요청이 들어온 origin을 쓴다 */
export function callbackUrl(requestUrl: string): string {
  return new URL("/auth/github/callback", process.env.APP_URL || requestUrl).toString();
}

export function authorizeUrl(state: string, redirectUri: string): string {
  const url = new URL("/login/oauth/authorize", oauthBase());
  url.searchParams.set("client_id", credentials().clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("allow_signup", "true");
  return url.toString();
}

export async function exchangeCode(code: string, redirectUri: string): Promise<string> {
  const { clientId, clientSecret } = credentials();
  const res = await fetch(new URL("/login/oauth/access_token", oauthBase()), {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (!res.ok || !body.access_token) {
    throw new Error(`GitHub 토큰 교환 실패: ${body.error ?? res.status}`);
  }
  return body.access_token;
}

export async function fetchGithubUser(accessToken: string): Promise<GithubUser> {
  const res = await fetch(new URL("/user", apiBase()), {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "todo-goals-app",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GitHub 사용자 조회 실패: ${res.status}`);
  const u = (await res.json()) as Partial<GithubUser>;
  if (typeof u.id !== "number" || typeof u.login !== "string") {
    throw new Error("GitHub 사용자 응답 형식이 올바르지 않습니다.");
  }
  return { id: u.id, login: u.login, avatar_url: typeof u.avatar_url === "string" ? u.avatar_url : "" };
}
