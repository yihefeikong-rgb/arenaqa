// ============================================================
// SidePanel — 右侧摘要面板 v2.0
// 评分 + 融合，深色主题优化
// ============================================================

'use client';

import { useChatStore } from '@/stores/chat-store';
import { EmptyState } from '@/components/ui/EmptyState';

export function SidePanel() {
  const { status, judgeResult, fusionResult, judgeError } = useChatStore();

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)]">
      {/* 面板标题 */}
      <div className="px-4 pt-4 pb-3 shrink-0" style={{ borderBottom: '1px solid var(--color-divider)' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            aria-hidden="true"
          >
            R
          </div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">结果摘要</h2>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* 空闲 */}
        {status === 'idle' && (
          <EmptyState
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
            title="等待结果"
            description="发送问题后，评分和综合答案将在此显示"
          />
        )}

        {/* 流式回答中 */}
        {status === 'streaming' && (
          <div className="flex flex-col items-center gap-2.5 py-10" aria-label="等待回答">
            <div className="flex gap-1">
              {[0, 0.12, 0.24, 0.36].map((d, i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--color-primary)', animationDelay: `${d}s` }}
                />
              ))}
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)]">等待各模型完成...</p>
          </div>
        )}

        {/* 裁判评分中 */}
        {status === 'judging' && (
          <div className="rounded-lg p-3.5 card flex items-center gap-3">
            <svg className="animate-spin shrink-0 text-[var(--color-primary)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <div>
              <p className="text-[13px] font-medium text-[var(--color-text-primary)]">AI 裁判评分中</p>
              <p className="text-[var(--font-caption)] text-[var(--color-text-secondary)] mt-0.5">评估各模型回答质量...</p>
            </div>
          </div>
        )}

        {/* 融合生成中 */}
        {status === 'fusing' && judgeResult && (
          <div className="animate-slide-up space-y-3">
            <ScoreSection scores={judgeResult.scores} />
            <div className="rounded-lg p-3.5 card flex items-center gap-3">
              <svg className="animate-spin shrink-0" style={{ color: '#7C3AED' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <div>
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">融合生成中</p>
                <p className="text-[var(--font-caption)] text-[var(--color-text-secondary)] mt-0.5">综合各模型回答...</p>
              </div>
            </div>
          </div>
        )}

        {/* 完成 — 评分+融合 */}
        {status === 'complete' && judgeResult && fusionResult && !judgeError && (
          <div className="animate-slide-up space-y-3">
            <ScoreSection scores={judgeResult.scores} />
            <FusionSection />
          </div>
        )}

        {/* 完成 — 评分不可用 */}
        {status === 'complete' && judgeError && (
          <div className="animate-slide-up space-y-3">
            <div className="rounded-lg p-3" style={{ background: 'var(--color-warning-light)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="text-[13px] font-medium" style={{ color: '#F59E0B' }}>评分不可用</p>
              </div>
              <p className="text-[var(--font-caption)] opacity-80" style={{ color: '#F59E0B' }}>{judgeError}</p>
            </div>
            {fusionResult && <FusionSection />}
          </div>
        )}

        {/* 完成 — 仅评分无融合 */}
        {status === 'complete' && judgeResult && !fusionResult && !judgeError && (
          <div className="animate-slide-up">
            <ScoreSection scores={judgeResult.scores} />
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 子组件 ====================

type ScoreItem = { model: string; accuracy: number; completeness: number; actionability: number; safety: number; total: number; brief: string };

function ScoreSection({ scores }: { scores: ScoreItem[] }) {
  const bestScore = Math.max(...scores.map((s) => s.total), 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span className="text-[var(--font-caption)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">AI 评分</span>
      </div>

      <div className="space-y-1.5">
        {scores.map((s) => {
          const isBest = s.total === bestScore && bestScore > 0;
          return (
            <div
              key={s.model}
              className="rounded-lg p-3 card"
              style={isBest ? { borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' } : undefined}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{s.model}</span>
                  {isBest && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                      最佳
                    </span>
                  )}
                </div>
                <span className="text-[15px] font-bold tabular-nums"
                      style={{ color: isBest ? '#F59E0B' : 'var(--color-text-primary)' }}>
                  {s.total.toFixed(1)}
                </span>
              </div>

              {/* 四维评分条 */}
              <div className="space-y-1">
                {[
                  { label: '准确', value: s.accuracy, color: '#2563EB' },
                  { label: '完整', value: s.completeness, color: '#10B981' },
                  { label: '可操作', value: s.actionability, color: '#7C3AED' },
                  { label: '安全', value: s.safety, color: '#F59E0B' },
                ].map((dim) => (
                  <div key={dim.label} className="flex items-center gap-2">
                    <span className="w-8 text-[var(--font-caption)] text-[var(--color-text-disabled)] shrink-0">{dim.label}</span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${dim.value * 10}%`, backgroundColor: dim.color }}
                      />
                    </div>
                    <span className="w-3.5 text-[var(--font-caption)] text-[var(--color-text-disabled)] text-right tabular-nums">{dim.value}</span>
                  </div>
                ))}
              </div>

              {s.brief && !s.brief.includes('未配置') && !s.brief.includes('解析失败') && (
                <p className="text-[var(--font-caption)] text-[var(--color-text-secondary)] mt-2 leading-relaxed">{s.brief}</p>
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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <span className="text-[var(--font-caption)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">综合答案</span>
      </div>

      {/* 共识 */}
      {fusionResult.consensus.length > 0 && (
        <div className="rounded-lg p-3" style={{ background: 'var(--color-success-light)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <h4 className="flex items-center gap-1 text-[var(--font-caption)] font-semibold mb-1.5" style={{ color: '#10B981' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            共识
          </h4>
          <ul className="space-y-0.5">
            {fusionResult.consensus.map((c, i) => (
              <li key={i} className="text-[var(--font-caption)] flex gap-1.5" style={{ color: 'rgba(16,185,129,0.85)' }}>
                <span className="shrink-0 mt-0.5 opacity-60">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 分歧 */}
      {fusionResult.divergences.length > 0 && (
        <div className="rounded-lg p-3" style={{ background: 'var(--color-warning-light)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <h4 className="flex items-center gap-1 text-[var(--font-caption)] font-semibold mb-1.5" style={{ color: '#F59E0B' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            分歧
          </h4>
          {fusionResult.divergences.map((d, i) => (
            <div key={i} className="mb-1.5 last:mb-0">
              <p className="text-[var(--font-caption)] font-medium mb-0.5" style={{ color: 'rgba(245,158,11,0.9)' }}>{d.topic}</p>
              {Object.entries(d.positions).map(([model, pos]) => (
                <p key={model} className="text-[10px] ml-2 flex gap-1" style={{ color: 'rgba(245,158,11,0.7)' }}>
                  <span className="font-semibold shrink-0">{model}:</span>
                  <span>{pos}</span>
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 综合答案 */}
      <div className="rounded-lg p-3 card">
        <h4 className="text-[var(--font-caption)] font-semibold text-[var(--color-text-secondary)] mb-1.5 flex items-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-info)]">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          综合答案
        </h4>
        <div className="text-[var(--font-small)] text-[var(--color-text-body)] leading-relaxed whitespace-pre-wrap">
          {fusionResult.synthesized}
        </div>
      </div>

      {/* 置信度指示器 */}
      <div className="rounded-lg p-3 card">
        <h4 className="text-[var(--font-caption)] font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-success)]">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          置信度
        </h4>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[var(--font-caption)] text-[var(--color-text-secondary)]">
            回答一致性
          </span>
          <span className="text-[var(--font-caption)] font-semibold tabular-nums text-[var(--color-success)]">
            {(() => {
              const consensusCount = fusionResult.consensus.length;
              const divergenceCount = fusionResult.divergences.length;
              const total = consensusCount + divergenceCount;
              if (total === 0) return '--';
              const confidence = Math.round((consensusCount / total) * 100);
              return `${confidence}%`;
            })()}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(() => {
                const c = fusionResult.consensus.length;
                const d = fusionResult.divergences.length;
                const total = c + d;
                return total === 0 ? 0 : (c / total) * 100;
              })()}%`,
              background: 'linear-gradient(90deg, #10B981, #059669)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
