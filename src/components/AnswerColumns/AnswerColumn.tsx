// ============================================================
// AnswerColumn — 单模型回答列
// ============================================================

'use client';

import type { AnswerState } from '@/types';

interface Props {
  answer: AnswerState;
}

export function AnswerColumn({ answer }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* 列头 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{answer.model}</span>
          {answer.status === 'streaming' && (
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.1s]" />
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
            </span>
          )}
        </div>
        {answer.status === 'done' && answer.latencyMs && (
          <span className="text-xs text-gray-400">{answer.latencyMs}ms</span>
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-3">
        {answer.status === 'error' ? (
          <div className="rounded bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">出错了</p>
            <p className="text-xs text-red-500 dark:text-red-300 mt-1">{answer.error}</p>
          </div>
        ) : answer.content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <StreamingText content={answer.content} isStreaming={answer.status === 'streaming'} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">
              {answer.status === 'streaming' ? '等待回答...' : '无内容'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StreamingText({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  return (
    <>
      <pre className="whitespace-pre-wrap font-sans text-sm">{content}</pre>
      {isStreaming && <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-text-bottom" />}
    </>
  );
}
