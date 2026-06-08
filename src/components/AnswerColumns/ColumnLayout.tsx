// ============================================================
// ColumnLayout — 多列回答区（可拖拽布局）
// ============================================================

'use client';

import { Panel, PanelGroup, PanelResizeHandle } from '@/hooks/useResizablePanels';
import { useChatStore } from '@/stores/chat-store';
import { AnswerColumn } from './AnswerColumn';

// 模型标识映射
const MODEL_BADGE: Record<string, { icon: string; gradient: string }> = {
  deepseek: { icon: '🧠', gradient: 'from-blue-500 to-cyan-500' },
  qwen: { icon: '🌊', gradient: 'from-purple-500 to-pink-500' },
  claude: { icon: '✨', gradient: 'from-amber-500 to-orange-500' },
  gemini: { icon: '🔮', gradient: 'from-green-500 to-emerald-500' },
};

export function ColumnLayout() {
  const { answers, status } = useChatStore();
  const modelNames = Object.keys(answers);

  // 空状态
  if (modelNames.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm px-8">
          {/* 装饰图标 */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="9" y1="10" x2="15" y2="10" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            等待你的第一个问题
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
            左侧选择模型，输入问题后点击发送。
            各模型的回答将在独立的列中实时流式显示。
          </p>
        </div>
      </div>
    );
  }

  // 动态生成可拖拽列
  const panels = modelNames.map((name, i) => (
    <Panel key={name} defaultSize={100 / modelNames.length} minSize={20}>
      <AnswerColumn
        answer={answers[name]}
        modelBadge={MODEL_BADGE[name]}
      />
    </Panel>
  ));

  // 在 panels 之间插入分割条
  const withHandles = panels.flatMap((panel, i) => {
    if (i === 0) return [panel];
    return [
      <PanelResizeHandle key={`handle-${i}`}>
        <div className="w-[3px] h-full bg-transparent hover:bg-blue-500/30 active:bg-blue-500/50 cursor-col-resize transition-colors" />
      </PanelResizeHandle>,
      panel,
    ];
  });

  return (
    <PanelGroup direction="horizontal" className="h-full">
      {withHandles}
    </PanelGroup>
  );
}
