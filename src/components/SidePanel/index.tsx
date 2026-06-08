// ============================================================
// SidePanel — 右侧摘要面板（评分 + 融合）
// ============================================================

'use client';

import { useChatStore } from '@/stores/chat-store';

export function SidePanel() {
  const { status, judgeResult, fusionResult, judgeError } = useChatStore();

  return (
    <div className="flex flex-col h-full">
      {/* 面板标题 */}
      <div className="px-5 pt-5 pb-3 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold">
            R
          </div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">结果摘要</h2>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* 空闲状态 */}
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/30 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">等待结果</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 leading-relaxed">
              发送问题后，评分和综合答案将在此显示
            </p>
          </div>
        )}

        {/* 流式回答中 */}
        {status === 'streaming' && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="flex gap-1.5">
              {[0, 0.15, 0.3, 0.45].map((d, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: `${d}s` }}
                />
              ))}
            </div>
            <p className="text-sm text-[var(--text-tertiary)]">等待各模型完成...</p>
          </div>
        )}

        {/* 裁判评分中 */}
        {status === 'judging' && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] p-4">
            <svg className="animate-spin shrink-0 text-blue-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">AI 裁判评分中</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">正在评估各模型回答质量...</p>
            </div>
          </div>
        )}

        {/* 融合生成中（评分已完成） */}
        {status === 'fusing' && judgeResult && (
          <div className="animate-slide-up space-y-4">
            <ScoreSection scores={judgeResult.scores} />
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] p-4">
              <svg className="animate-spin shrink-0 text-purple-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">融合生成中</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">正在综合各模型回答...</p>
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
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">评分不可用</p>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-300/80">{judgeError}</p>
            </div>
            {fusionResult && <FusionSection />}
          </div>
        )}

        {/* 完成 — 仅评分无融合（单模型等情况） */}
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

/** 可视化评分区域 */
function ScoreSection({ scores }: { scores: ScoreItem[] }) {
  // 找出最高分
  const bestScore = Math.max(...scores.map((s) => s.total), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">AI 评分</span>
      </div>

      <div className="space-y-2">
        {scores.map((s) => {
          const ratio = bestScore > 0 ? s.total / bestScore : 0;
          const isBest = s.total === bestScore;
          return (
            <div
              key={s.model}
              className={`rounded-xl border p-3 transition-all ${
                isBest
                  ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20'
                  : 'border-[var(--border-light)] bg-[var(--bg-base)]'
              }`}
            >
              {/* 模型名 + 总分 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{s.model}</span>
                  {isBest && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 font-medium">
                      最佳
                    </span>
                  )}
                </div>
                <span className={`text-lg font-bold tabular-nums ${isBest ? 'text-yellow-600 dark:text-yellow-400' : 'text-[var(--text-primary)]'}`}>
                  {s.total.toFixed(1)}
                </span>
              </div>

              {/* 四维评分条 */}
              <div className="space-y-1.5">
                {[
                  { label: '准确', value: s.accuracy, color: 'bg-blue-500' },
                  { label: '完整', value: s.completeness, color: 'bg-emerald-500' },
                  { label: '可操作', value: s.actionability, color: 'bg-violet-500' },
                  { label: '安全', value: s.safety, color: 'bg-amber-500' },
                ].map((dim) => (
                  <div key={dim.label} className="flex items-center gap-2">
                    <span className="w-10 text-[10px] text-[var(--text-tertiary)] shrink-0">{dim.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--border-light)] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${dim.color} transition-all duration-500`}
                        style={{ width: `${dim.value * 10}%` }}
                      />
                    </div>
                    <span className="w-4 text-[10px] text-[var(--text-tertiary)] text-right tabular-nums">{dim.value}</span>
                  </div>
                ))}
              </div>

              {/* 评价 */}
              {s.brief && !s.brief.includes('未配置') && !s.brief.includes('解析失败') && (
                <p className="text-[11px] text-[var(--text-tertiary)] mt-2 leading-relaxed">{s.brief}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 融合结果区域 */
function FusionSection() {
  const { fusionResult } = useChatStore();
  if (!fusionResult) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">综合答案</span>
      </div>

      {fusionResult.consensus.length > 0 && (
        <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 p-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400 mb-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            共识
          </h4>
          <ul className="space-y-1">
            {fusionResult.consensus.map((c, i) => (
              <li key={i} className="text-xs text-green-700 dark:text-green-300/90 flex gap-2">
                <span className="text-green-400 shrink-0 mt-0.5">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fusionResult.divergences.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            分歧
          </h4>
          <div className="space-y-2">
            {fusionResult.divergences.map((d, i) => (
              <div key={i}>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">{d.topic}</p>
                {Object.entries(d.positions).map(([model, pos]) => (
                  <p key={model} className="text-[11px] text-amber-700 dark:text-amber-400/80 ml-2 flex gap-2">
                    <span className="font-semibold shrink-0">{model}:</span>
                    <span>{pos}</span>
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-base)] p-3">
        <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          综合答案
        </h4>
        <div className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
          {fusionResult.synthesized}
        </div>
      </div>
    </div>
  );
}
