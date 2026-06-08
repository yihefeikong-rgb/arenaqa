// ============================================================
// AnswerColumn — 单模型回答列
// ============================================================

'use client';

import type { AnswerState } from '@/types';

const MODEL_BADGE: Record<string, { icon: string; gradient: string }> = {
  deepseek: { icon: '🧠', gradient: 'from-blue-500 to-cyan-500' },
  qwen: { icon: '🌊', gradient: 'from-purple-500 to-pink-500' },
  claude: { icon: '✨', gradient: 'from-amber-500 to-orange-500' },
  gemini: { icon: '🔮', gradient: 'from-green-500 to-emerald-500' },
};

interface Props {
  answer: AnswerState;
  modelBadge?: { icon: string; gradient: string };
}

export function AnswerColumn({ answer, modelBadge }: Props) {
  const badge = modelBadge ?? MODEL_BADGE[answer.model] ?? { icon: '🤖', gradient: 'from-gray-500 to-gray-600' };

  return (
    <div className="flex flex-col h-full">
      {/* 列头 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-light)] bg-[var(--bg-base)]">
        <div className="flex items-center gap-2.5">
          {/* 模型图标 */}
          <span className="text-lg">{badge.icon}</span>
          <div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{answer.model}</span>
            {answer.status === 'streaming' && (
              <span className="ml-2 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.3s]" />
              </span>
            )}
          </div>
        </div>
        {answer.status === 'done' && answer.latencyMs && (
          <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">
            {answer.latencyMs < 1000
              ? `${answer.latencyMs}ms`
              : `${(answer.latencyMs / 1000).toFixed(1)}s`}
          </span>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {answer.status === 'error' ? (
          <div className="m-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">响应出错</span>
            </div>
            <p className="text-xs text-red-500 dark:text-red-300/80 leading-relaxed">{answer.error}</p>
          </div>
        ) : answer.content ? (
          <div className="p-4 animate-fade-in">
            <StreamingContent content={answer.content} isStreaming={answer.status === 'streaming'} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              {answer.status === 'streaming' ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <span
                        key={i}
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">等待回答...</p>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)]">无内容</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** 流式文本渲染（带光标 + Markdown） */
function StreamingContent({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  return (
    <div className="text-sm leading-relaxed text-[var(--text-primary)]">
      <SimpleMarkdown text={content} />
      {isStreaming && (
        <span className="inline-block w-[2px] h-[1em] bg-blue-500 animate-pulse ml-0.5 align-text-bottom" />
      )}
    </div>
  );
}

/** 简易 Markdown 渲染（代码块、粗体、列表、行内代码） */
function SimpleMarkdown({ text }: { text: string }) {
  // 按代码块分割
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        const codeMatch = part.match(/^```(?:\w*)\n([\s\S]*?)```$/);
        if (codeMatch) {
          return (
            <pre
              key={i}
              className="my-3 p-3 rounded-xl bg-gray-900 dark:bg-gray-950 text-gray-100 text-xs leading-relaxed overflow-x-auto"
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

/** 行内格式：粗体、行内代码 */
function InlineText({ text }: { text: string }) {
  // 转义 HTML
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 分割成段落
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

              // 列表项
              const listMatch = line.match(/^(\s*[-*]\s)(.*)/);
              if (listMatch) {
                return (
                  <span key={li} className="block ml-4">
                    <span className="text-blue-500 mr-2">•</span>
                    <InlineLine text={listMatch[2]} />
                  </span>
                );
              }

              // 数字列表
              const numMatch = line.match(/^(\s*\d+[.]\s)(.*)/);
              if (numMatch) {
                return (
                  <span key={li} className="block ml-4">
                    <span className="text-blue-500 mr-2">{numMatch[1].trim()}</span>
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

/** 单行渲染：行内代码、粗体 */
function InlineLine({ text }: { text: string }) {
  // 处理行内代码 `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return (
    <>
      {codeParts.map((part, i) => {
        const inlineCode = part.match(/^`([^`]+)`$/);
        if (inlineCode) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[13px] font-mono text-pink-600 dark:text-pink-400"
            >
              {inlineCode[1]}
            </code>
          );
        }
        // 处理粗体 **text**
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {boldParts.map((bp, j) => {
              const boldMatch = bp.match(/^\*\*([^*]+)\*\*$/);
              if (boldMatch) {
                return <strong key={j} className="font-semibold">{boldMatch[1]}</strong>;
              }
              return bp;
            })}
          </span>
        );
      })}
    </>
  );
}
