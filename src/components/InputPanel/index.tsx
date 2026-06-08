// ============================================================
// InputPanel — 输入区（问题输入 + 模型选择 + 发送按钮）
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';

const AVAILABLE_MODELS = [
  { id: 'deepseek', label: 'DeepSeek V3', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { id: 'qwen', label: '通义千问 Qwen3', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { id: 'claude', label: 'Claude Sonnet 4', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { id: 'gemini', label: 'Gemini 2.5 Pro', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
];

export function InputPanel() {
  const [prompt, setPrompt] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(['deepseek', 'qwen']));
  const { status, sendChat } = useChatStore();
  const isDisabled = status === 'streaming' || status === 'judging' || status === 'fusing';

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

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        AI 问答竞技场
      </h2>

      {/* 模型选择 */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          选择模型
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => toggleModel(m.id)}
              disabled={isDisabled}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selected.has(m.id)
                  ? m.color + ' ring-2 ring-offset-1 ring-blue-500'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              } disabled:opacity-50`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* 问题输入 */}
      <div className="flex-1 flex flex-col">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          你的问题
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder="输入你的问题，按 Enter 发送，Shift+Enter 换行..."
          className="flex-1 w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          rows={6}
        />
      </div>

      {/* 发送按钮 */}
      <button
        onClick={handleSend}
        disabled={isDisabled || !prompt.trim() || selected.size === 0}
        className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
      >
        {isDisabled ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            处理中...
          </span>
        ) : (
          '发送提问'
        )}
      </button>

      {/* 状态提示 */}
      {status === 'complete' && (
        <p className="text-xs text-green-600 dark:text-green-400 text-center">
          ✅ 回答完成！可继续提问
        </p>
      )}
    </div>
  );
}
