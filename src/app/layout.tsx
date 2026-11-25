import type { Metadata } from "next";
import localFont from "next/font/local";
import { Nav } from "@/components/Nav";
import { StoreHydrator } from "@/components/StoreHydrator";
import "./globals.css";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "목표 → 할 일",
  description: "1년 목표, 주간 계획, 오늘의 할 일을 한 줄로 잇는 할 일 관리 앱",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-zinc-100 text-zinc-900">
        <StoreHydrator />
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="py-4 text-center text-xs text-zinc-400">
          데이터는 GitHub 계정별로 서버에 저장됩니다.
        </footer>
      </body>
    </html>
  );
}
