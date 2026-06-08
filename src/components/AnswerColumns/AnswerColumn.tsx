// ============================================================
// AnswerColumn — 单模型回答列 v2.1
// 流式渲染 + Markdown + 点赞/踩
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import type { AnswerState } from '@/types';

interface Props {
  answer: AnswerState;
  modelBadge?: { icon: React.ReactNode; color: string };
}

export function AnswerColumn({ answer, modelBadge }: Props) {
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);

  const handleLike = useCallback(() => {
    setLiked((prev) => {
      if (prev === 'up') return null;
      if (prev === 'down') { setDislikes((d) => Math.max(0, d - 1)); setLikes((l) => l + 1); return 'up'; }
      setLikes((l) => l + 1);
      return 'up';
    });
  }, []);

  const handleDislike = useCallback(() => {
    setLiked((prev) => {
      if (prev === 'down') return null;
      if (prev === 'up') { setLikes((l) => Math.max(0, l - 1)); setDislikes((d) => d + 1); return 'down'; }
      setDislikes((d) => d + 1);
      return 'down';
    });
  }, []);
  const badge = modelBadge ?? {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /></svg>
    ),
    color: '#64748B',
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* 列头 */}
      <div className="flex items-center justify-between px-3.5 py-2.5 shrink-0"
           style={{ borderBottom: '1px solid var(--color-divider)' }}>
        <div className="flex items-center gap-2">
          <span className="shrink-0 opacity-80" aria-hidden="true">{badge.icon}</span>
          <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
            {answer.model}
          </span>
          {answer.status === 'streaming' && (
            <span className="inline-flex items-center gap-0.5 ml-0.5" aria-label="流式输出中">
              {[0, 0.15, 0.3].map((d, i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full animate-pulse"
                  style={{ backgroundColor: badge.color, animationDelay: `${d}s` }}
                />
              ))}
            </span>
          )}
          {answer.status === 'done' && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {answer.status === 'error' && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
        </div>
        {answer.status === 'done' && answer.latencyMs != null && (
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
          <div className="m-3 rounded-lg p-3" style={{ background: 'var(--color-error-light)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="text-[13px] font-medium text-[#EF4444]">响应出错</span>
            </div>
            <p className="text-[var(--font-caption)] text-[#EF4444] opacity-80 leading-relaxed">{answer.error}</p>
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
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: badge.color, animationDelay: `${d}s` }}
                    />
                  ))}
                </div>
                <p className="text-[var(--font-caption)] text-[var(--color-text-disabled)]">等待回答...</p>
              </div>
            ) : (
              <p className="text-[var(--font-caption)] text-[var(--color-text-disabled)]">无内容</p>
            )}
          </div>
        )}
      </div>

      {/* 底部操作栏 — 仅完成时显示 */}
      {answer.status === 'done' && (
        <div className="shrink-0 flex items-center justify-between px-3.5 py-2"
             style={{ borderTop: '1px solid var(--color-divider)' }}>
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all duration-150
                         text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
              aria-label="赞"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={liked === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   className={liked === 'up' ? 'text-[var(--color-primary)]' : ''}>
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
              </svg>
              {likes > 0 && <span className="tabular-nums">{likes}</span>}
            </button>
            <button
              onClick={handleDislike}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all duration-150
                         text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
              aria-label="踩"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={liked === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   className={liked === 'down' ? 'text-red-500' : ''}>
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
              </svg>
              {dislikes > 0 && <span className="tabular-nums">{dislikes}</span>}
            </button>
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(answer.content)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all duration-150
                       text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
            aria-label="复制内容"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            复制
          </button>
        </div>
      )}
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
          className="inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom rounded-full"
          style={{ backgroundColor: badgeColor, animation: 'pulse 0.8s ease-in-out infinite' }}
        />
      )}
    </div>
  );
}

/** 简易 Markdown */
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
              className="my-3 p-3 rounded-lg text-[13px] leading-relaxed overflow-x-auto"
              style={{ background: '#0d1117', color: '#e6edf3' }}
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
              // 无序列表
              const listMatch = line.match(/^(\s*[-*]\s)(.*)/);
              if (listMatch) {
                return (
                  <span key={li} className="block ml-3">
                    <span className="text-[var(--color-primary)] mr-1.5 opacity-70">•</span>
                    <InlineLine text={listMatch[2]} />
                  </span>
                );
              }
              // 有序列表
              const numMatch = line.match(/^(\s*\d+[.]\s)(.*)/);
              if (numMatch) {
                return (
                  <span key={li} className="block ml-3">
                    <span className="text-[var(--color-primary)] mr-1.5 opacity-70 font-mono text-[12px]">{numMatch[1].trim()}</span>
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
            <code
              key={i}
              className="px-1 py-0.5 rounded text-[12px] font-mono"
              style={{
                background: 'var(--color-bg)',
                color: '#E879F9',
                border: '1px solid var(--color-border)',
              }}
            >
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
