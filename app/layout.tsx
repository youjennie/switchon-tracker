import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LangProvider } from "./components/LangProvider";

const nanum = localFont({
  variable: "--font-nanum",
  src: [
    { path: "./fonts/NanumBarunGothic.ttf", weight: "400", style: "normal" },
    { path: "./fonts/NanumBarunGothicBold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Switch-On Diet Tracker",
  description: "박용우 박사의 4주 스위치온 다이어트 데스크탑 트래커",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${nanum.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col paper-surface">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
