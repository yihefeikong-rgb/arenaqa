// ============================================================
// ArenaQA — 主工作台页面
// 三栏布局：左(输入) / 中(多列回答) / 右(摘要)
// ============================================================

'use client';

import { Panel, PanelGroup, PanelResizeHandle } from '@/hooks/useResizablePanels';
import { InputPanel } from '@/components/InputPanel';
import { ColumnLayout } from '@/components/AnswerColumns/ColumnLayout';
import { SidePanel } from '@/components/SidePanel';

export default function Home() {
  return (
    <main className="h-screen w-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <PanelGroup direction="horizontal" autoSaveId="arenaqa-layout">
        {/* 左侧：输入面板 */}
        <Panel defaultSize={20} minSize={15} maxSize={35}>
          <div className="h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <InputPanel />
          </div>
        </Panel>

        <PanelResizeHandle>
          <div className="w-1 h-full bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 cursor-col-resize transition-colors" />
        </PanelResizeHandle>

        {/* 中间：多列回答区 */}
        <Panel defaultSize={55} minSize={30}>
          <div className="h-full bg-white dark:bg-gray-900">
            <ColumnLayout />
          </div>
        </Panel>

        <PanelResizeHandle>
          <div className="w-1 h-full bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 cursor-col-resize transition-colors" />
        </PanelResizeHandle>

        {/* 右侧：摘要面板 */}
        <Panel defaultSize={25} minSize={15} maxSize={40}>
          <div className="h-full border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <SidePanel />
          </div>
        </Panel>
      </PanelGroup>
    </main>
  );
}
