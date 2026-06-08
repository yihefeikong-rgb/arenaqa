// ============================================================
// ColumnLayout — 多列回答区（可拖拽布局）
// ============================================================

'use client';

import { Panel, PanelGroup, PanelResizeHandle } from '@/hooks/useResizablePanels';
import { useChatStore } from '@/stores/chat-store';
import { AnswerColumn } from './AnswerColumn';

export function ColumnLayout() {
  const { answers } = useChatStore();
  const modelNames = Object.keys(answers);

  if (modelNames.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
        <div className="text-center">
          <p className="text-lg">选择模型并输入问题开始</p>
          <p className="text-sm mt-1">回答将在各列中流式显示</p>
        </div>
      </div>
    );
  }

  // 动态生成可拖拽列
  const panels = modelNames.map((name, i) => (
    <Panel key={name} defaultSize={100 / modelNames.length} minSize={20}>
      <AnswerColumn answer={answers[name]} />
    </Panel>
  ));

  // 在 panels 之间插入分割条
  const withHandles = panels.flatMap((panel, i) => {
    if (i === 0) return [panel];
    return [
      <PanelResizeHandle key={`handle-${i}`}>
        <div className="w-1 h-full bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 cursor-col-resize transition-colors" />
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
