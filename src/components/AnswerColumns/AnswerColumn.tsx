// ============================================================
// AnswerColumn — 单模型回答列
// 对齐设计系统规范 v1.0（无 emoji，SVG 图标）
// ============================================================

'use client';

import type { AnswerState } from '@/types';

// 模型标识 — 全部 SVG 图标，无 emoji
const MODEL_BADGE: Record<string, { icon: React.ReactNode; color: string }> = {
  deepseek: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
        <path d="M16 14v2a4 4 0 0 1-8 0v-2" />
        <path d="M8 10h8" />
        <path d="M12 10v4" />
      </svg>
    ),
    color: '#2563EB',
  },
  qwen: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    color: '#7C3AED',
  },
  claude: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5Z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    color: '#F59E0B',
  },
  gemini: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    color: '#10B981',
  },
};

interface Props {
  answer: AnswerState;
  modelBadge?: { icon: React.ReactNode; color: string };
}

export function AnswerColumn({ answer, modelBadge }: Props) {
  const badge = modelBadge ?? MODEL_BADGE[answer.model] ?? {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /></svg>
    ),
    color: '#6B7280',
  };

  return (
    <div className="flex flex-col h-full">
      {/* 列头 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="flex items-center gap-2.5">
          {/* 模型图标 */}
          <span className="shrink-0" aria-hidden="true">{badge.icon}</span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--font-body)] font-semibold text-[var(--color-text-primary)]">
              {answer.model}
            </span>
            {answer.status === 'streaming' && (
              <span className="inline-flex items-center gap-1" aria-label="流式输出中">
                {[0, 0.15, 0.3].map((d, i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{
                      backgroundColor: badge.color,
                      animationDelay: `${d}s`,
                    }}
                  />
                ))}
              </span>
            )}
          </div>
        </div>
        {answer.status === 'done' && answer.latencyMs && (
          <span className="text-[var(--font-caption)] text-[var(--color-text-disabled)] tabular-nums">
            {answer.latencyMs < 1000
              ? `${answer.latencyMs}ms`
              : `${(answer.latencyMs / 1000).toFixed(1)}s`}
          </span>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {answer.status === 'error' ? (
          <div className="m-3 rounded-[var(--radius-default)] border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="text-[var(--font-body)] font-medium text-red-600 dark:text-red-400">响应出错</span>
            </div>
            <p className="text-[var(--font-small)] text-red-500 dark:text-red-300/80 leading-relaxed">{answer.error}</p>
          </div>
        ) : answer.content ? (
          <div className="p-4 animate-fade-in">
            <StreamingContent content={answer.content} isStreaming={answer.status === 'streaming'} badgeColor={badge.color} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            {answer.status === 'streaming' ? (
              <div className="flex flex-col items-center gap-2" aria-label="等待回答">
                <div className="flex gap-1">
                  {[0, 0.15, 0.3].map((d, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: badge.color, animationDelay: `${d}s` }}
                    />
                  ))}
                </div>
                <p className="text-[var(--font-small)] text-[var(--color-text-disabled)]">等待回答...</p>
              </div>
            ) : (
              <p className="text-[var(--font-small)] text-[var(--color-text-disabled)]">无内容</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** 流式文本渲染 */
function StreamingContent({ content, isStreaming, badgeColor }: { content: string; isStreaming: boolean; badgeColor: string }) {
  return (
    <div className="text-[var(--font-body)] leading-relaxed text-[var(--color-text-body)]">
      <SimpleMarkdown text={content} />
      {isStreaming && (
        <span
          className="inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom"
          style={{ backgroundColor: badgeColor, animation: 'pulse 0.8s ease-in-out infinite' }}
        />
      )}
    </div>
  );
}

/** 简易 Markdown 渲染 */
function SimpleMarkdown({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        const codeMatch = part.match(/^```(?:\w*)\n([\s\S]*?)```$/);
        if (codeMatch) {
          return (
            <pre
              key={i}
              className="my-3 p-3 rounded-[var(--radius-default)] bg-[#111827] dark:bg-[#0f172a] text-gray-100 text-[var(--font-small)] leading-relaxed overflow-x-auto"
            >
              <code>{codeMatch[1]}</code>
            </pre>
          );
        }
        return <InlineText key={i} text={part} />;
      })}
    </>
  );
}

function InlineText({ text }: { text: string }) {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const paragraphs = escaped.split('\n\n');

  return (
    <>
      {paragraphs.map((para, pi) => {
        if (!para.trim()) return null;
        const lines = para.split('\n');
        return (
          <p key={pi} className="mb-2 last:mb-0">
            {lines.map((line, li) => {
              if (!line.trim()) return <br key={li} />;
              const listMatch = line.match(/^(\s*[-*]\s)(.*)/);
              if (listMatch) {
                return (
                  <span key={li} className="block ml-4">
                    <span className="text-[var(--color-primary)] mr-2">•</span>
                    <InlineLine text={listMatch[2]} />
                  </span>
                );
              }
              const numMatch = line.match(/^(\s*\d+[.]\s)(.*)/);
              if (numMatch) {
                return (
                  <span key={li} className="block ml-4">
                    <span className="text-[var(--color-primary)] mr-2">{numMatch[1].trim()}</span>
                    <InlineLine text={numMatch[2]} />
                  </span>
                );
              }
              return (
                <span key={li}>
                  <InlineLine text={line} />
                  {li < lines.length - 1 && <br />}
                </span>
              );
            })}
          </p>
        );
      })}
    </>
  );
}

function InlineLine({ text }: { text: string }) {
  const codeParts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {codeParts.map((part, i) => {
        const inlineCode = part.match(/^`([^`]+)`$/);
        if (inlineCode) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-bg)] text-[13px] font-mono text-pink-600 dark:text-pink-400">
              {inlineCode[1]}
            </code>
          );
        }
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {boldParts.map((bp, j) => {
              const boldMatch = bp.match(/^\*\*([^*]+)\*\*$/);
              return boldMatch
                ? <strong key={j} className="font-semibold text-[var(--color-text-primary)]">{boldMatch[1]}</strong>
                : bp;
            })}
          </span>
        );
      })}
    </>
  );
}
