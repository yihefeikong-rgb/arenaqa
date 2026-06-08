// ============================================================
// ArenaQA — 主工作台页面 v2.1
// 三栏布局：左(输入) / 中(多列回答) / 右(摘要)
// 对齐设计规范：间距、边框、响应式
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
      <Panel defaultSize={22} minSize={16} maxSize={32}>
        <div className="h-full bg-[var(--color-surface)] border-r border-[var(--color-divider)]">
          <InputPanel />
        </div>
      </Panel>

      <PanelResizeHandle>
        <div className="w-[3px] h-full flex items-center justify-center group cursor-col-resize bg-[var(--color-bg)]">
          <div className="w-[1px] h-6 rounded-full bg-[var(--color-divider)] group-hover:bg-[var(--color-primary)] group-hover:h-10 transition-all duration-200" />
        </div>
      </PanelResizeHandle>

      {/* 中间：多列回答区 */}
      <Panel defaultSize={53} minSize={28}>
        <div className="h-full bg-[var(--color-bg)]">
          <ColumnLayout />
        </div>
      </Panel>

      <PanelResizeHandle>
        <div className="w-[3px] h-full flex items-center justify-center group cursor-col-resize bg-[var(--color-bg)]">
          <div className="w-[1px] h-6 rounded-full bg-[var(--color-divider)] group-hover:bg-[var(--color-primary)] group-hover:h-10 transition-all duration-200" />
        </div>
      </PanelResizeHandle>

      {/* 右侧：摘要面板 */}
      <Panel defaultSize={25} minSize={15} maxSize={40}>
        <div className="h-full bg-[var(--color-surface)] border-l border-[var(--color-divider)]">
          <SidePanel />
        </div>
      </Panel>
    </PanelGroup>
  );
}
