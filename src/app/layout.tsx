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
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <StoreHydrator />
        <Nav />
        {/* 각 화면이 PageHeader와 가로 전체 Tile로 직접 구성한다 */}
        <main className="flex-1">{children}</main>
        <footer className="bg-parchment">
          <div className="mx-auto max-w-[1080px] border-t border-hairline px-5 py-8 text-xs text-muted-48 sm:px-8">
            <p>1년 목표 → 주간 목표 → 오늘의 할 일. 데이터는 GitHub 계정별로 서버에 저장됩니다.</p>
            <p className="mt-2">© 2026 목표 → 할 일</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
