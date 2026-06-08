// ============================================================
// NavBar — 顶栏导航 + 深色模式切换
// ============================================================

'use client';

import { useState, useEffect } from 'react';

export function NavBar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // 读取系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(prefersDark);

    // 监听系统变化
    const listener = (e: MediaQueryListEvent) => setDark(e.matches);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
    return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener);
  }, []);

  const toggle = () => {
    setDark((prev) => !prev);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-12 border-b border-[var(--border-light)] bg-[var(--bg-surface)] flex items-center justify-between px-6">
      {/* 左侧品牌 */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          AQ
        </div>
        <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
          ArenaQA
        </span>
        <span className="hidden sm:inline text-xs text-[var(--text-tertiary)] ml-1">
          AI 问答竞技场
        </span>
      </div>

      {/* 右侧工具 */}
      <div className="flex items-center gap-3">
        <a
          href="https://github.com/MingYuePop/SpecForge"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          SpecForge
        </a>

        {/* 深色模式切换 */}
        <button
          onClick={toggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          title={dark ? '切换到浅色模式' : '切换到深色模式'}
        >
          {dark ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
