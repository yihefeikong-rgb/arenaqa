// ============================================================
// InputPanel — 输入区（问题输入 + 模型选择 + 发送按钮）
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';

// 模型元数据
const MODEL_META: Record<string, { label: string; icon: string; gradient: string }> = {
  deepseek: { label: 'DeepSeek V3', icon: '🧠', gradient: 'from-blue-500 to-cyan-500' },
  qwen: { label: '通义千问', icon: '🌊', gradient: 'from-purple-500 to-pink-500' },
  claude: { label: 'Claude 4', icon: '✨', gradient: 'from-amber-500 to-orange-500' },
  gemini: { label: 'Gemini 2.5', icon: '🔮', gradient: 'from-green-500 to-emerald-500' },
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

  // 计算流式进度
  const totalModels = selected.size;
  const doneModels = Object.values(answers).filter((a) => a.status === 'done' || a.status === 'error').length;
  const progress = isBusy && totalModels > 0 ? Math.round((doneModels / totalModels) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* 标题区 */}
      <div className="px-5 pt-5 pb-3 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            AQ
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--text-primary)]">AI 问答竞技场</h1>
            <p className="text-[11px] text-[var(--text-tertiary)]">多模型并发对比 · AI 裁判评分</p>
          </div>
        </div>
      </div>

      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* 模型选择 */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
            </svg>
            选择模型
            <span className="text-[10px] normal-case font-normal ml-auto text-[var(--text-tertiary)]">
              {selected.size} / {Object.keys(MODEL_META).length}
            </span>
          </label>
          <div className="flex flex-col gap-1.5">
            {Object.entries(MODEL_META).map(([id, meta]) => {
              const isOn = selected.has(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleModel(id)}
                  disabled={isBusy}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isOn
                      ? 'bg-gradient-to-r ' + meta.gradient + ' text-white shadow-sm'
                      : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span className="text-base">{meta.icon}</span>
                  <span>{meta.label}</span>
                  {isOn && (
                    <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            你的问题
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            placeholder="输入你的问题，按 Enter 发送…"
            className="w-full resize-none rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] p-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all disabled:opacity-40"
            rows={5}
          />
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5 ml-0.5">
            Enter 发送 · Shift+Enter 换行
          </p>
        </div>
      </div>

      {/* 底部固定区：进度 + 发送 */}
      <div className="px-5 pb-5 pt-1 space-y-3">
        {/* 流式进度条 */}
        {isBusy && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-[var(--text-tertiary)]">
              <span>
                {status === 'streaming' ? '接收回答中...' :
                 status === 'judging' ? '裁判评分中...' : '融合生成中...'}
              </span>
              <span>{doneModels}/{totalModels}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={isBusy || !prompt.trim() || selected.size === 0}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98]"
        >
          {isBusy ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              {status === 'streaming' ? '接收中...' : '处理中...'}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              发送提问
            </span>
          )}
        </button>

        {/* 完成状态 */}
        {status === 'complete' && (
          <p className="text-xs text-green-600 dark:text-green-400 text-center animate-fade-in">
            ✅ 回答完成！可继续提问
          </p>
        )}
      </div>
    </div>
  );
}
