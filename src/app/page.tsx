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
    <PanelGroup direction="horizontal" autoSaveId="arenaqa-layout">
      {/* 左侧：输入面板 */}
      <Panel defaultSize={20} minSize={15} maxSize={35}>
        <div className="h-full border-r border-[var(--border-light)] bg-[var(--bg-surface)]">
          <InputPanel />
        </div>
      </Panel>

      <PanelResizeHandle>
        <div className="w-[3px] h-full bg-transparent hover:bg-blue-500/30 active:bg-blue-500/50 cursor-col-resize transition-colors mx-0.5" />
      </PanelResizeHandle>

      {/* 中间：多列回答区 */}
      <Panel defaultSize={55} minSize={30}>
        <div className="h-full bg-[var(--bg-surface)]">
          <ColumnLayout />
        </div>
      </Panel>

      <PanelResizeHandle>
        <div className="w-[3px] h-full bg-transparent hover:bg-blue-500/30 active:bg-blue-500/50 cursor-col-resize transition-colors mx-0.5" />
      </PanelResizeHandle>

      {/* 右侧：摘要面板 */}
      <Panel defaultSize={25} minSize={15} maxSize={40}>
        <div className="h-full border-l border-[var(--border-light)] bg-[var(--bg-surface)]">
          <SidePanel />
        </div>
      </Panel>
    </PanelGroup>
  );
}
