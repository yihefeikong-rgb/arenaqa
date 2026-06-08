// ============================================================
// InputPanel — 输入区（问题输入 + 模型选择 + 发送按钮）
// 对齐设计系统规范 v1.0
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { Button } from '@/components/ui/Button';

// 模型元数据 — 全部改用 Lucide SVG 图标
const MODEL_META: Record<string, { label: string; icon: React.ReactNode; gradient: string; color: string }> = {
  deepseek: {
    label: 'DeepSeek V3',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
        <path d="M16 14v2a4 4 0 0 1-8 0v-2" />
        <path d="M8 10h8" />
        <path d="M12 10v4" />
      </svg>
    ),
    gradient: 'from-blue-600 to-cyan-600',
    color: '#2563EB',
  },
  qwen: {
    label: '通义千问',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    gradient: 'from-purple-600 to-pink-600',
    color: '#7C3AED',
  },
  claude: {
    label: 'Claude 4',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5Z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    gradient: 'from-amber-500 to-orange-600',
    color: '#F59E0B',
  },
  gemini: {
    label: 'Gemini 2.5',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-600',
    color: '#10B981',
  },
};

export function InputPanel() {
  const [prompt, setPrompt] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(['deepseek', 'qwen']));
  const { status, answers, sendChat } = useChatStore();
  const isBusy = status === 'streaming' || status === 'judging' || status === 'fusing';

  const toggleModel = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSend = useCallback(() => {
    if (!prompt.trim() || selected.size === 0) return;
    sendChat(prompt.trim(), Array.from(selected));
  }, [prompt, selected, sendChat]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const totalModels = selected.size;
  const doneModels = Object.values(answers).filter((a) => a.status === 'done' || a.status === 'error').length;
  const progress = isBusy && totalModels > 0 ? Math.round((doneModels / totalModels) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* 标题区 — 间距规范 md */}
      <div className="px-5 pt-5 pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          {/* 品牌标识 */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-[var(--shadow-1)] shrink-0"
               aria-hidden="true">
            AQ
          </div>
          <div>
            <h1 className="text-[var(--font-h3)] font-semibold text-[var(--color-text-primary)] leading-tight">
              AI 问答竞技场
            </h1>
            <p className="text-[var(--font-caption)] text-[var(--color-text-secondary)]">
              多模型并发对比 · AI 裁判评分
            </p>
          </div>
        </div>
      </div>

      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* 模型选择 */}
        <div role="group" aria-label="选择模型">
          <label className="flex items-center gap-1.5 mb-3 text-[var(--font-small)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
            </svg>
            选择模型
            <span className="ml-auto text-[var(--font-caption)] font-normal normal-case text-[var(--color-text-disabled)]">
              {selected.size} / {Object.keys(MODEL_META).length}
            </span>
          </label>
          <div className="flex flex-col gap-2">
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
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-default)]
                    text-[var(--font-body)] font-medium transition-all duration-150 ease-out
                    disabled:opacity-40 disabled:cursor-not-allowed
                    ${isOn
                      ? 'bg-gradient-to-r ' + meta.gradient + ' text-white shadow-[var(--shadow-1)]'
                      : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                    }
                  `}
                >
                  <span className="opacity-90">{meta.icon}</span>
                  <span>{meta.label}</span>
                  {isOn && (
                    <svg className="ml-auto shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 问题输入 */}
        <div>
          <label
            htmlFor="prompt-input"
            className="flex items-center gap-1.5 mb-3 text-[var(--font-small)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            你的问题
          </label>
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            placeholder="输入你的问题，按 Enter 发送…"
            aria-describedby="prompt-hint"
            className="
              w-full resize-none rounded-[var(--radius-default)]
              border border-[var(--color-border)]
              bg-[var(--color-bg)] p-3.5
              text-[var(--font-body)] text-[var(--color-text-primary)]
              placeholder:text-[var(--color-text-disabled)]
              focus:outline-none focus:border-[var(--color-primary)]
              focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]
              transition-all duration-150 ease-out
              disabled:opacity-40
            "
            rows={5}
          />
          <p id="prompt-hint" className="mt-1.5 ml-0.5 text-[var(--font-caption)] text-[var(--color-text-secondary)]">
            Enter 发送 · Shift+Enter 换行
          </p>
        </div>
      </div>

      {/* 底部固定区 */}
      <div className="px-5 pb-5 pt-1 space-y-3">
        {/* 流式进度条 */}
        {isBusy && (
          <div className="space-y-1.5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="回答进度">
            <div className="flex justify-between text-[var(--font-caption)] text-[var(--color-text-secondary)]">
              <span>
                {status === 'streaming' ? '接收回答中...' :
                 status === 'judging' ? '裁判评分中...' : '融合生成中...'}
              </span>
              <span className="tabular-nums">{doneModels}/{totalModels}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-purple-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 发送按钮 — 使用 Button 组件 */}
        <Button
          variant="primary"
          size="md"
          onClick={handleSend}
          disabled={isBusy || !prompt.trim() || selected.size === 0}
          loading={isBusy}
          className="w-full rounded-[var(--radius-default)]"
          icon={
            !isBusy ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            ) : undefined
          }
        >
          发送提问
        </Button>

        {/* 完成状态 */}
        {status === 'complete' && (
          <p className="text-[var(--font-small)] text-[var(--color-success)] text-center animate-fade-in flex items-center justify-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            回答完成，可继续提问
          </p>
        )}
      </div>
    </div>
  );
}
