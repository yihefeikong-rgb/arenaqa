// ============================================================
// ArenaQA — 根布局
// 包含导航栏、深色模式支持、Provider 初始化
// ============================================================

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { NavBar } from '@/components/shared/NavBar';

// 启动时初始化 Provider（从环境变量注册可用的 AI 模型）
import { initializeProviders } from '@/lib/provider-registry';
initializeProviders();

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ArenaQA — AI 问答竞技场',
  description: '开源、自托管的个人 AI 问答工作台。并发对比多个模型，AI 裁判自动评分融合。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NavBar />
        <main className="h-[calc(100vh-48px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
