// ============================================================
// InputPanel — 输入区 v2.1
// 对齐 frontend-ui-design-system.md 规范
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
    gradient: 'linear-gradient(135deg, #2563EB, #06B6D4)',
    color: '#2563EB',
  },
  qwen: {
    label: 'Qwen3 235B',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    color: '#7C3AED',
  },
  claude: {
    label: 'Claude 4',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5Z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #F59E0B, #F97316)',
    color: '#F59E0B',
  },
  gemini: {
    label: 'Gemini 2.5',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    color: '#10B981',
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
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-md"
               style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }} aria-hidden="true">AQ</div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-[var(--color-text-primary)] leading-tight truncate">AI 问答竞技场</h1>
            <p className="text-[var(--font-caption)] text-[var(--color-text-disabled)] leading-tight mt-0.5">多模型并发对比</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-[var(--color-divider)]" />

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        <div role="group" aria-label="选择模型">
          <label className="flex items-center gap-1.5 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-disabled)]">
              <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span className="text-[var(--font-caption)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">模型</span>
            <span className="ml-auto text-[var(--font-caption)] text-[var(--color-text-disabled)] tabular-nums">{selected.size}/{Object.keys(MODEL_META).length}</span>
          </label>
          <div className="flex flex-col gap-2">
            {Object.entries(MODEL_META).map(([id, meta]) => {
              const isOn = selected.has(id);
              return (
                <button key={id} onClick={() => toggleModel(id)} disabled={isBusy} role="checkbox" aria-checked={isOn}
                        aria-label={`${meta.label}${isOn ? '（已选）' : '（未选）'}`}
                        className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed focus-ring ${isOn ? 'text-white shadow-md' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'}`}
                        style={isOn ? { background: meta.gradient } : undefined}>
                  <span className="shrink-0 opacity-90">{meta.icon}</span>
                  <span className="truncate">{meta.label}</span>
                  {isOn && (
                    <svg className="ml-auto shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="prompt-input" className="flex items-center gap-1.5 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-disabled)]">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-[var(--font-caption)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">提问</span>
          </label>
          <textarea id="prompt-input" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={handleKeyDown}
                    disabled={isBusy} placeholder="输入你的问题…" aria-describedby="prompt-hint" rows={4}
                    className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-[var(--font-body)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-glow)] focus:border-[var(--color-primary)] transition-all duration-150 ease-out disabled:opacity-50" />
          <p id="prompt-hint" className="mt-2 text-[var(--font-caption)] text-[var(--color-text-disabled)]">Enter 发送 · Shift+Enter 换行</p>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3 space-y-3 border-t border-[var(--color-divider)] bg-[var(--color-surface)]">
        {isBusy && (
          <div className="space-y-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="flex justify-between text-[var(--font-caption)]">
              <span className="text-[var(--color-text-secondary)]">{status === 'streaming' ? '回答中...' : status === 'judging' ? '裁判评分...' : '融合生成...'}</span>
              <span className="text-[var(--color-text-disabled)] tabular-nums">{doneModels}/{totalModels}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div className="h-full rounded-full progress-animated transition-all duration-500 ease-out"
                   style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }} />
            </div>
          </div>
        )}

        <Button variant="primary" size="md" onClick={handleSend} disabled={isBusy || !prompt.trim() || selected.size === 0}
                loading={isBusy} className="w-full rounded-lg"
                icon={!isBusy ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                ) : undefined}>
          发送提问
        </Button>

        {status === 'complete' && (
          <p className="text-[var(--font-caption)] text-[var(--color-success)] text-center animate-fade-in flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            回答完成
          </p>
        )}
      </div>
    </div>
  );
}
