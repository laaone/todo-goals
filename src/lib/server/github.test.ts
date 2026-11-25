import { afterEach, describe, expect, it, vi } from "vitest";
import { appOrigin, callbackUrl } from "./github";

afterEach(() => vi.unstubAllEnvs());

const PREVIEW = "https://todo-goals-git-master-me.vercel.app/auth/github";

describe("appOrigin / callbackUrl", () => {
  it("설정이 없으면(로컬) 요청 주소를 쓴다", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(callbackUrl("http://localhost:3000/auth/github")).toBe("http://localhost:3000/auth/github/callback");
  });

  it("Vercel production이면 배포별 주소가 아니라 정식 도메인을 쓴다", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "todo-goals-navy.vercel.app");
    expect(appOrigin(PREVIEW)).toBe("https://todo-goals-navy.vercel.app");
    expect(callbackUrl(PREVIEW)).toBe("https://todo-goals-navy.vercel.app/auth/github/callback");
  });

  it("Vercel preview 배포는 자기 주소를 쓴다", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "todo-goals-navy.vercel.app");
    expect(appOrigin(PREVIEW)).toBe("https://todo-goals-git-master-me.vercel.app");
  });

  it("APP_URL이 가장 우선이고, 앞뒤 공백·줄바꿈은 무시한다", () => {
    vi.stubEnv("APP_URL", " https://todo.example.com/ \r\n");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "todo-goals-navy.vercel.app");
    expect(callbackUrl(PREVIEW)).toBe("https://todo.example.com/auth/github/callback");
  });
});
