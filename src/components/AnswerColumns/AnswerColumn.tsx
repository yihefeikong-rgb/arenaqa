// ============================================================
// AnswerColumn — 单模型回答列 v2.1
// 流式渲染 + Markdown + 点赞/踩 + 复制
// 对齐设计规范：卡片、阴影、动效
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
      setLikes((l) => l + 1); return 'up';
    });
  }, []);

  const handleDislike = useCallback(() => {
    setLiked((prev) => {
      if (prev === 'down') return null;
      if (prev === 'up') { setLikes((l) => Math.max(0, l - 1)); setDislikes((d) => d + 1); return 'down'; }
      setDislikes((d) => d + 1); return 'down';
    });
  }, []);

  const handleCopy = useCallback(async () => {
    if (!answer.content) return;
    try { await navigator.clipboard.writeText(answer.content); } catch {
      const ta = document.createElement('textarea'); ta.value = answer.content;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
  }, [answer.content]);

  const badge = modelBadge ?? {
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /></svg>),
    color: '#64748B',
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* 列头 */}
      <div className="flex items-center justify-between px-3.5 py-2.5 shrink-0 border-b border-[var(--color-divider)]">
        <div className="flex items-center gap-2">
          <span className="shrink-0 opacity-80" aria-hidden="true">{badge.icon}</span>
          <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{answer.model}</span>
          {answer.status === 'streaming' && (
            <span className="inline-flex items-center gap-0.5 ml-0.5" aria-label="流式输出中">
              {[0, 0.15, 0.3].map((d, i) => (<span key={i} className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: badge.color, animationDelay: `${d}s` }} />))}
            </span>
          )}
          {answer.status === 'done' && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
          )}
          {answer.status === 'error' && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
          )}
        </div>
        {answer.status === 'done' && answer.latencyMs != null && (
          <span className="text-[var(--font-caption)] text-[var(--color-text-disabled)] tabular-nums">{(answer.latencyMs / 1000).toFixed(1)}s</span>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3">
        {answer.status === 'error' ? (
          <div className="flex items-start gap-2 p-3 rounded-lg animate-fade-in" style={{ background: 'var(--color-error-light)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            <p className="text-[var(--font-small)] text-[var(--color-error)] leading-relaxed">{answer.error || '请求失败'}</p>
          </div>
        ) : answer.content ? (
          <div className="animate-fade-in">
            <StreamingContent content={answer.content} isStreaming={answer.status === 'streaming'} badgeColor={badge.color} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--color-text-disabled)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg>
            <span className="text-[var(--font-caption)]">等待回答…</span>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      {answer.status === 'done' && answer.content && (
        <div className="flex items-center justify-between px-3.5 py-2 shrink-0 border-t border-[var(--color-divider)] gap-2">
          <div className="flex items-center gap-1">
            <button onClick={handleLike}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[var(--font-caption)] font-medium transition-all duration-150 focus-ring ${liked === 'up' ? 'text-[var(--color-success)] bg-[var(--color-success-light)]' : 'text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]'}`}
                    aria-label="赞同" aria-pressed={liked === 'up'}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7v-10l3.5-5.38a2 2 0 0 1 3.5 1.64V10" /></svg>
              {likes > 0 && <span className="tabular-nums">{likes}</span>}
            </button>
            <button onClick={handleDislike}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[var(--font-caption)] font-medium transition-all duration-150 focus-ring ${liked === 'down' ? 'text-[var(--color-error)] bg-[var(--color-error-light)]' : 'text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]'}`}
                    aria-label="反对" aria-pressed={liked === 'down'}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H17v10l-3.5 5.38a2 2 0 0 1-3.5-1.64V14" /></svg>
              {dislikes > 0 && <span className="tabular-nums">{dislikes}</span>}
            </button>
          </div>
          <button onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[var(--font-caption)] font-medium transition-all duration-150 text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] focus-ring"
                  aria-label="复制内容">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            复制
          </button>
        </div>
      )}
    </div>
  );
}

function StreamingContent({ content, isStreaming, badgeColor }: { content: string; isStreaming: boolean; badgeColor: string }) {
  return (
    <div className="text-[var(--font-body)] leading-relaxed text-[var(--color-text-body)]">
      <SimpleMarkdown text={content} />
      {isStreaming && (<span className="inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom rounded-full" style={{ backgroundColor: badgeColor, animation: 'pulse 0.8s ease-in-out infinite' }} />)}
    </div>
  );
}

function SimpleMarkdown({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (<>{parts.map((part, i) => {
    const codeMatch = part.match(/^```(?:\w*)\n([\s\S]*?)```$/);
    if (codeMatch) return (<pre key={i} className="my-3 p-3 rounded-lg text-[13px] leading-relaxed overflow-x-auto code-block-dark shadow-1"><code>{codeMatch[1]}</code></pre>);
    return <InlineText key={i} text={part} />;
  })}</>);
}

function InlineText({ text }: { text: string }) {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const paragraphs = escaped.split('\n\n');
  return (<>{paragraphs.map((para, pi) => {
    if (!para.trim()) return null;
    const lines = para.split('\n');
    return (<p key={pi} className="mb-2.5 last:mb-0">{lines.map((line, li) => {
      if (!line.trim()) return <br key={li} />;
      const listMatch = line.match(/^(\s*[-*]\s)(.*)/);
      if (listMatch) return (<span key={li} className="block ml-3"><span className="text-[var(--color-primary)] mr-1.5 opacity-70">•</span><InlineLine text={listMatch[2]} /></span>);
      const numMatch = line.match(/^(\s*\d+[.]\s)(.*)/);
      if (numMatch) return (<span key={li} className="block ml-3"><span className="text-[var(--color-primary)] mr-1.5 opacity-70 font-mono text-[12px]">{numMatch[1].trim()}</span><InlineLine text={numMatch[2]} /></span>);
      return (<span key={li}><InlineLine text={line} />{li < lines.length - 1 && <br />}</span>);
    })}</p>);
  })}</>);
}

function InlineLine({ text }: { text: string }) {
  const codeParts = text.split(/(`[^`]+`)/g);
  return (<>{codeParts.map((part, i) => {
    const inlineCode = part.match(/^`([^`]+)`$/);
    if (inlineCode) return (<code key={i} className="inline-code">{inlineCode[1]}</code>);
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return (<span key={i}>{boldParts.map((bp, j) => {
      const boldMatch = bp.match(/^\*\*([^*]+)\*\*$/);
      return boldMatch ? <strong key={j} className="font-semibold text-[var(--color-text-primary)]">{boldMatch[1]}</strong> : bp;
    })}</span>);
  })}</>);
}
