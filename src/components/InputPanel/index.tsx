// ============================================================
// InputPanel — 输入区 v2.1
// 对齐 frontend-ui-design-system.md 规范，现代化UI版本
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { Button } from '@/components/ui/Button';

const MODEL_META: Record<string, { label: string; icon: React.ReactNode; gradient: string; color: string }> = {
  deepseek: {
    label: 'DeepSeek V3',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" /><path d="M16 14v2a4 4 0 0 1-8 0v-2" /><path d="M8 10h8" /><path d="M12 10v4" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#6366f1',
  },
  qwen: {
    label: 'Qwen3 235B',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    color: '#ec4899',
  },
  claude: {
    label: 'Claude 4',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5Z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    color: '#f59e0b',
  },
  gemini: {
    label: 'Gemini 2.5',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #10b981, #0ea5e9)',
    color: '#10b981',
  },
};

export function InputPanel() {
  const [prompt, setPrompt] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(['deepseek', 'qwen']));
  const { status, answers, sendChat } = useChatStore();
  const isBusy = status === 'streaming' || status === 'judging' || status === 'fusing';

  const toggleModel = useCallback((id: string) => {
    if (isBusy) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [isBusy]);

  const handleSend = useCallback(() => {
    if (!prompt.trim() || selected.size === 0 || isBusy) return;
    sendChat(prompt.trim(), Array.from(selected));
  }, [prompt, selected, sendChat, isBusy]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const totalModels = selected.size;
  const doneModels = Object.values(answers).filter((a) => a.status === 'done' || a.status === 'error').length;
  const progress = isBusy && totalModels > 0 ? Math.round((doneModels / totalModels) * 100) : 0;

  return (
    <div className="flex flex-col h-full modern-gradient-bg">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shrink-0 shadow-md bg-gradient-to-br from-indigo-500 to-purple-500">
            AQ
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)] leading-tight truncate">AI 问答竞技场</h1>
            <p className="text-[var(--font-caption)] text-[var(--color-text-secondary)] leading-tight mt-0.5">多模型并发对比</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-[var(--color-divider)] mx-4" />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
        <div role="group" aria-label="选择模型">
          <label className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-disabled)]">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span className="text-[var(--font-caption)] font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">模型选择</span>
            <span className="ml-auto text-[var(--font-caption)] text-[var(--color-text-disabled)] tabular-nums">{selected.size}/{Object.keys(MODEL_META).length}</span>
          </label>

          <div className="grid grid-cols-1 gap-3">
            {Object.entries(MODEL_META).map(([id, meta]) => {
              const isOn = selected.has(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleModel(id)}
                  disabled={isBusy}
                  role="checkbox"
                  aria-checked={isOn}
                  aria-label={`${meta.label}${isOn ? '（已选）' : '（未选）'}`}
                  className={`modern-card flex items-center gap-3 p-4 rounded-xl text-[14px] font-medium transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed focus-ring hover-animation ${isOn ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 ring-1 ring-indigo-200 dark:ring-indigo-700' : 'hover:scale-[1.02]'}`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={isOn ? { background: meta.gradient, color: 'white' } : { backgroundColor: 'var(--color-surface-elevated)' }}
                  >
                    {isOn ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : meta.icon}
                  </div>
                  <span className="truncate font-medium">{meta.label}</span>
                  <div className="ml-auto">
                    {isOn && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: meta.gradient }}
                      >
                        <svg className="text-white" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="prompt-input" className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-disabled)]">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-[var(--font-caption)] font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">问题输入</span>
          </label>
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            placeholder="请输入你的问题，AI助手将为您提供专业解答..."
            aria-describedby="prompt-hint"
            rows={5}
            className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-[var(--font-body)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-glow)] focus:border-[var(--color-primary)] transition-all duration-200 ease-out disabled:opacity-50 modern-card"
          />
          <p id="prompt-hint" className="mt-3 text-[var(--font-caption)] text-[var(--color-text-secondary)] flex items-center gap-2">
            <kbd className="px-2 py-1 text-[0.6rem] rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">↵</kbd>
            发送 ·
            <kbd className="px-2 py-1 text-[0.6rem] rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">Shift</kbd>
            <kbd className="px-2 py-1 text-[0.6rem] rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">↵</kbd>
            换行
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 pt-4 space-y-4 border-t border-[var(--color-divider)] bg-[var(--color-surface)] rounded-b-2xl">
        {isBusy && (
          <div className="space-y-3" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="flex justify-between text-[var(--font-caption)]">
              <span className="text-[var(--color-text-secondary)] font-medium">{status === 'streaming' ? '生成回答中...' : status === 'judging' ? 'AI 裁判评分...' : '融合分析中...'}</span>
              <span className="text-[var(--color-text-disabled)] tabular-nums font-medium">{doneModels}/{totalModels}</span>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-full rounded-full progress-animated transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #6366f1, #ec4899)'
                }}
              />
            </div>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={handleSend}
          disabled={isBusy || !prompt.trim() || selected.size === 0}
          loading={isBusy}
          className="w-full rounded-xl py-3 text-base font-semibold modern-card hover-animation"
          icon={!isBusy ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          ) : undefined}
        >
          {isBusy ? '处理中...' : '发送提问'}
        </Button>

        {status === 'complete' && (
          <p className="text-[var(--font-caption)] text-[var(--color-success)] text-center animate-fade-in flex items-center justify-center gap-2 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            所有模型回答完成
          </p>
        )}
      </div>
    </div>
  );
}