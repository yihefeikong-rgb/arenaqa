// ============================================================
// ColumnLayout — 多列回答区（可拖拽布局）
// 对齐设计系统规范 v1.0
// ============================================================

'use client';

import { Panel, PanelGroup, PanelResizeHandle } from '@/hooks/useResizablePanels';
import { useChatStore } from '@/stores/chat-store';
import { AnswerColumn } from './AnswerColumn';
import { EmptyState } from '@/components/ui/EmptyState';

// 模型标识映射 — SVG 图标，无 emoji
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

export function ColumnLayout() {
  const { answers, status } = useChatStore();
  const modelNames = Object.keys(answers);

  // 空状态
  if (modelNames.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="9" y1="10" x2="15" y2="10" />
          </svg>
        }
        title="等待你的第一个问题"
        description="左侧选择模型，输入问题后点击发送。各模型的回答将在独立的列中实时流式显示。"
      />
    );
  }

  const panels = modelNames.map((name, i) => (
    <Panel key={name} defaultSize={100 / modelNames.length} minSize={20}>
      <AnswerColumn
        answer={answers[name]}
        modelBadge={MODEL_BADGE[name]}
      />
    </Panel>
  ));

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
