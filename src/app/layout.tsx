import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DinoWalk - 恐竜育成ウォーキングゲーム",
  description: "歩いて恐竜を育てる、高齢者向けのヘルスケアゲームアプリです。草花を撮影してエサをあげ、恐竜と一緒に健康的な生活を送りましょう。",
  keywords: "恐竜, ウォーキング, ヘルスケア, 育成ゲーム, 高齢者, 健康管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-b from-sky-100 to-green-100 min-h-screen`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
