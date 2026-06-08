// ============================================================
// SidePanel — 右侧摘要面板（评分 + 融合）
// 对齐设计系统规范 v1.0
// ============================================================

'use client';

import { useChatStore } from '@/stores/chat-store';
import { EmptyState } from '@/components/ui/EmptyState';

export function SidePanel() {
  const { status, judgeResult, fusionResult, judgeError } = useChatStore();

  return (
    <div className="flex flex-col h-full">
      {/* 面板标题 */}
      <div className="px-5 pt-5 pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold shadow-[var(--shadow-1)]"
               aria-hidden="true">
            R
          </div>
          <h2 className="text-[var(--font-h3)] font-bold text-[var(--color-text-primary)]">结果摘要</h2>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* 空闲状态 */}
        {status === 'idle' && (
          <EmptyState
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
            title="等待结果"
            description="发送问题后，评分和综合答案将在此显示"
          />
        )}

        {/* 流式回答中 */}
        {status === 'streaming' && (
          <div className="flex flex-col items-center gap-3 py-12" aria-label="等待回答">
            <div className="flex gap-1.5">
              {[0, 0.15, 0.3, 0.45].map((d, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{ backgroundColor: 'var(--color-primary)', animationDelay: `${d}s` }}
                />
              ))}
            </div>
            <p className="text-[var(--font-body)] text-[var(--color-text-secondary)]">等待各模型完成...</p>
          </div>
        )}

        {/* 裁判评分中 */}
        {status === 'judging' && (
          <div className="flex items-center gap-3 rounded-[var(--radius-default)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <svg className="animate-spin shrink-0 text-[var(--color-primary)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <div>
              <p className="text-[var(--font-body)] font-medium text-[var(--color-text-primary)]">AI 裁判评分中</p>
              <p className="text-[var(--font-small)] text-[var(--color-text-secondary)] mt-0.5">正在评估各模型回答质量...</p>
            </div>
          </div>
        )}

        {/* 融合生成中 */}
        {status === 'fusing' && judgeResult && (
          <div className="animate-slide-up space-y-4">
            <ScoreSection scores={judgeResult.scores} />
            <div className="flex items-center gap-3 rounded-[var(--radius-default)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
              <svg className="animate-spin shrink-0 text-purple-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <div>
                <p className="text-[var(--font-body)] font-medium text-[var(--color-text-primary)]">融合生成中</p>
                <p className="text-[var(--font-small)] text-[var(--color-text-secondary)] mt-0.5">正在综合各模型回答...</p>
              </div>
            </div>
          </div>
        )}

        {/* 完成 — 有评分+融合 */}
        {status === 'complete' && judgeResult && fusionResult && !judgeError && (
          <div className="animate-slide-up space-y-4">
            <ScoreSection scores={judgeResult.scores} />
            <FusionSection />
          </div>
        )}

        {/* 完成 — 评分不可用 */}
        {status === 'complete' && judgeError && (
          <div className="animate-slide-up space-y-4">
            <div className="rounded-[var(--radius-default)] border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="text-[var(--font-body)] font-medium text-amber-700 dark:text-amber-400">评分不可用</p>
              </div>
              <p className="text-[var(--font-small)] text-amber-600 dark:text-amber-300/80">{judgeError}</p>
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
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span className="text-[var(--font-small)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">AI 评分</span>
      </div>

      <div className="space-y-2">
        {scores.map((s) => {
          const ratio = bestScore > 0 ? s.total / bestScore : 0;
          const isBest = s.total === bestScore;
          return (
            <div
              key={s.model}
              className={`rounded-[var(--radius-default)] border p-3 transition-all ${
                isBest
                  ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--font-body)] font-semibold text-[var(--color-text-primary)]">{s.model}</span>
                  {isBest && (
                    <span className="text-[var(--font-caption)] px-1.5 py-0.5 rounded-full bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 font-medium">
                      最佳
                    </span>
                  )}
                </div>
                <span className={`text-lg font-bold tabular-nums ${isBest ? 'text-yellow-600 dark:text-yellow-400' : 'text-[var(--color-text-primary)]'}`}>
                  {s.total.toFixed(1)}
                </span>
              </div>

              {/* 四维评分条 */}
              <div className="space-y-1.5">
                {[
                  { label: '准确', value: s.accuracy, color: 'rgb(37,99,235)' },
                  { label: '完整', value: s.completeness, color: 'rgb(16,185,129)' },
                  { label: '可操作', value: s.actionability, color: 'rgb(124,58,237)' },
                  { label: '安全', value: s.safety, color: 'rgb(245,158,11)' },
                ].map((dim) => (
                  <div key={dim.label} className="flex items-center gap-2">
                    <span className="w-10 text-[var(--font-caption)] text-[var(--color-text-secondary)] shrink-0">{dim.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${dim.value * 10}%`, backgroundColor: dim.color }}
                      />
                    </div>
                    <span className="w-4 text-[var(--font-caption)] text-[var(--color-text-secondary)] text-right tabular-nums">{dim.value}</span>
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
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <span className="text-[var(--font-small)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">综合答案</span>
      </div>

      {fusionResult.consensus.length > 0 && (
        <div className="rounded-[var(--radius-default)] border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 p-3">
          <h4 className="flex items-center gap-1.5 text-[var(--font-small)] font-semibold text-green-700 dark:text-green-400 mb-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            共识
          </h4>
          <ul className="space-y-1">
            {fusionResult.consensus.map((c, i) => (
              <li key={i} className="text-[var(--font-small)] text-green-700 dark:text-green-300/90 flex gap-2">
                <span className="text-green-400 shrink-0 mt-0.5">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fusionResult.divergences.length > 0 && (
        <div className="rounded-[var(--radius-default)] border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3">
          <h4 className="flex items-center gap-1.5 text-[var(--font-small)] font-semibold text-amber-700 dark:text-amber-400 mb-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            分歧
          </h4>
          {fusionResult.divergences.map((d, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="text-[var(--font-small)] font-medium text-amber-800 dark:text-amber-300 mb-1">{d.topic}</p>
              {Object.entries(d.positions).map(([model, pos]) => (
                <p key={model} className="text-[var(--font-caption)] text-amber-700 dark:text-amber-400/80 ml-2 flex gap-2">
                  <span className="font-semibold shrink-0">{model}:</span>
                  <span>{pos}</span>
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[var(--radius-default)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
        <h4 className="text-[var(--font-small)] font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-info)]">
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
    </div>
  );
}
