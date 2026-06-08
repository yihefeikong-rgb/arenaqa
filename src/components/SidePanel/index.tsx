// ============================================================
// SidePanel — 结果摘要面板 v2.1
// AI 评分 + 融合 + 置信度，现代化UI版本
// 对齐设计规范：卡片、间距、动效、无障碍
// ============================================================

'use client';

import { useChatStore } from '@/stores/chat-store';
import { EmptyState } from '@/components/ui/EmptyState';

type ScoreItem = {
  model: string;
  accuracy: number;
  completeness: number;
  actionability: number;
  safety: number;
  total: number;
  brief: string;
};

export function SidePanel() {
  const { judgeResult, judgeError, fusionResult, status } = useChatStore();

  if (status === 'idle' || status === 'streaming') {
    return (
      <EmptyState
        icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        }
        title="等待评分"
        description="回答完成后，AI 裁判将自动对各模型进行评分和融合分析。"
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 py-6 space-y-6 modern-gradient-bg">
      {judgeError && (
        <div className="rounded-xl p-5 flex items-start gap-4 animate-slide-up modern-card"
             style={{ background: 'var(--color-error-light)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="text-[var(--font-small)] font-semibold text-[var(--color-error)]">裁判评分失败</p>
            <p className="text-[var(--font-caption)] text-[var(--color-text-secondary)] mt-1">{judgeError}</p>
          </div>
        </div>
      )}

      {status === 'complete' && fusionResult && (
        <div className="animate-slide-up"><FusionSection /></div>
      )}

      {status === 'complete' && judgeResult && !fusionResult && !judgeError && (
        <div className="animate-slide-up"><ScoreSection scores={judgeResult.scores} /></div>
      )}
    </div>
  );
}

function ScoreSection({ scores }: { scores: ScoreItem[] }) {
  const bestScore = Math.max(...scores.map((s) => s.total), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <span className="text-[var(--font-caption)] font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">AI 评分</span>
      </div>

      <div className="space-y-3">
        {scores.map((s) => {
          const isBest = s.total === bestScore && bestScore > 0;
          return (
            <div key={s.model} className="modern-card rounded-xl p-5 transition-all duration-200 hover-animation"
                 style={isBest ? {
                   borderColor: 'rgba(245,158,11,0.3)',
                   background: 'linear-gradient(to bottom, var(--color-surface), var(--color-warning-light))',
                   boxShadow: '0 4px 12px rgba(245,158,11,0.1)'
                 } : undefined}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-bold text-[var(--color-text-primary)]">{s.model}</span>
                  {isBest && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-bold"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>🏆 最佳</span>
                  )}
                </div>
                <span className="text-[20px] font-extrabold tabular-nums"
                      style={{ color: isBest ? '#F59E0B' : 'var(--color-text-primary)' }}>{s.total.toFixed(1)}</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: '准确性', value: s.accuracy, color: '#2563EB', icon: '🎯' },
                  { label: '完整性', value: s.completeness, color: '#10B981', icon: '✅' },
                  { label: '可操作性', value: s.actionability, color: '#7C3AED', icon: '🔧' },
                  { label: '安全性', value: s.safety, color: '#F59E0B', icon: '🛡️' },
                ].map((dim) => (
                  <div key={dim.label} className="flex items-center gap-3">
                    <span className="w-12 text-[var(--font-caption)] text-[var(--color-text-disabled)] shrink-0 flex items-center gap-1">
                      {dim.icon} {dim.label}
                    </span>
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                      <div className="h-full rounded-full transition-all duration-700 ease-out"
                           style={{
                             width: `${dim.value * 10}%`,
                             background: `linear-gradient(90deg, ${dim.color}, ${dim.color}dd)`
                           }} />
                    </div>
                    <span className="w-6 text-[var(--font-caption)] text-[var(--color-text-disabled)] text-right tabular-nums font-medium">{dim.value}</span>
                  </div>
                ))}
              </div>

              {s.brief && !s.brief.includes('未配置') && !s.brief.includes('解析失败') && (
                <p className="text-[var(--font-small)] text-[var(--color-text-secondary)] mt-4 leading-relaxed border-t border-[var(--color-border)] pt-3">{s.brief}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FusionSection() {
  const { fusionResult } = useChatStore();
  if (!fusionResult) return null;

  const c = fusionResult.consensus.length;
  const d = fusionResult.divergences.length;
  const total = c + d;
  const conf = total === 0 ? 0 : Math.round((c / total) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.12)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
        <span className="text-[var(--font-caption)] font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">综合分析</span>
      </div>

      {fusionResult.consensus.length > 0 && (
        <div className="rounded-xl p-5 animate-scale-in modern-card"
             style={{ background: 'var(--color-success-light)', border: '1px solid rgba(16,185,129,0.18)' }}>
          <h4 className="flex items-center gap-2 text-[var(--font-caption)] font-bold mb-3" style={{ color: '#10B981' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            🤝 共识观点
          </h4>
          <ul className="space-y-2">
            {fusionResult.consensus.map((item, i) => (
              <li key={i} className="text-[var(--font-small)] flex gap-2 leading-relaxed" style={{ color: 'rgba(16,185,129,0.9)' }}>
                <span className="shrink-0 mt-0.5 opacity-60">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fusionResult.divergences.length > 0 && (
        <div className="rounded-xl p-5 animate-scale-in modern-card"
             style={{ background: 'var(--color-warning-light)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <h4 className="flex items-center gap-2 text-[var(--font-caption)] font-bold mb-3" style={{ color: '#F59E0B' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            🔄 分歧焦点
          </h4>
          {fusionResult.divergences.map((div, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="text-[var(--font-small)] font-semibold mb-2 flex items-center gap-1" style={{ color: 'rgba(245,158,11,0.9)' }}>
                💡 {div.topic}
              </p>
              {Object.entries(div.positions).map(([model, pos]) => (
                <p key={model} className="text-[var(--font-caption)] ml-2 flex gap-2 pl-3 border-l-2 border-[var(--color-warning)]" style={{ color: 'rgba(245,158,11,0.7)' }}>
                  <span className="font-semibold text-[var(--color-text-primary)] shrink-0">{model}:</span>
                  <span>{pos}</span>
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="modern-card rounded-xl p-5 animate-scale-in">
        <h4 className="text-[var(--font-caption)] font-bold text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-info)]">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          📝 综合答案
        </h4>
        <div className="text-[var(--font-small)] text-[var(--color-text-body)] leading-relaxed whitespace-pre-wrap border-t border-[var(--color-border)] pt-3">{fusionResult.synthesized}</div>
      </div>

      <div className="modern-card rounded-xl p-5 animate-scale-in">
        <h4 className="text-[var(--font-caption)] font-bold text-[var(--color-text-secondary)] mb-4 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-success)]">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          📊 置信度分析
        </h4>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[var(--font-caption)] text-[var(--color-text-secondary)]">模型一致性</span>
          <span className="text-[var(--font-caption)] font-bold tabular-nums"
                style={{ color: conf >= 80 ? '#10B981' : conf >= 50 ? '#F59E0B' : '#EF4444' }}>
            {total === 0 ? '--' : `${conf}%`}
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
          <div className="h-full rounded-full transition-all duration-700 ease-out"
               style={{
                 width: `${total === 0 ? 0 : (c / total) * 100}%`,
                 background: `linear-gradient(90deg, ${conf >= 80 ? '#10B981' : conf >= 50 ? '#F59E0B' : '#EF4444'}, ${conf >= 80 ? '#059669' : conf >= 50 ? '#D97706' : '#DC2626'})`,
               }} />
        </div>
        <p className="text-[var(--font-caption)] text-[var(--color-text-secondary)] mt-2">
          {conf >= 80 ? '高度一致 ✅' : conf >= 50 ? '基本一致 ⚖️' : '存在一定分歧 ⚠️'}
        </p>
      </div>
    </div>
  );
}