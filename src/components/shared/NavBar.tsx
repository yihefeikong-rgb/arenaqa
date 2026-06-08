// ============================================================
// NavBar — 顶栏导航 + 深色模式切换 v2.1
// 玻璃态效果 + 精致图标 + 规范按钮
// 对齐 frontend-ui-design-system.md 规范
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useChatStore } from '@/stores/chat-store';

export function NavBar() {
  const [dark, setDark] = useState(false);
  const { status, reset } = useChatStore();

  useEffect(() => {
    const saved = localStorage.getItem('arenaqa-theme');
    const prefersDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(prefersDark);
    if (prefersDark) document.documentElement.classList.add('dark');
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('arenaqa-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <header className="h-12 border-b border-[var(--color-divider)] glass flex items-center justify-between px-5 shrink-0 z-50">
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          aria-hidden="true"
        >AQ</div>
        <span className="text-[var(--font-body)] font-semibold text-[var(--color-text-primary)] tracking-tight">ArenaQA</span>
        <span className="hidden md:inline text-[var(--font-caption)] text-[var(--color-text-disabled)] ml-0.5">AI 问答竞技场</span>
      </div>
      <nav className="flex items-center gap-1.5" aria-label="顶部导航">
        {(status !== 'idle') && (
          <button onClick={reset} className="h-8 px-3 rounded-[var(--radius-sm)] text-[var(--font-caption)] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-all duration-150 flex items-center gap-1.5 focus-ring" aria-label="新建问答">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <span className="hidden sm:inline">新建</span>
          </button>
        )}
        <div className="w-px h-4 bg-[var(--color-divider)] mx-1" />
        <a href="https://github.com/MingYuePop/SpecForge" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-all duration-150 focus-ring" aria-label="GitHub">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
        </a>
        <button onClick={toggle} className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-all duration-150 focus-ring" aria-label={dark ? '切换到浅色模式' : '切换到深色模式'}>
          {dark ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          )}
        </button>
      </nav>
    </header>
  );
}
