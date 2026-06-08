// ============================================================
// ArenaQA — 主工作台页面 v2.1
// 三栏布局：左(输入) / 中(多列回答) / 右(摘要)
// 对齐设计规范：间距、边框、响应式，现代化UI
// ============================================================

'use client';

import { Panel, PanelGroup, PanelResizeHandle } from '@/hooks/useResizablePanels';
import { InputPanel } from '@/components/InputPanel';
import { ColumnLayout } from '@/components/AnswerColumns/ColumnLayout';
import { SidePanel } from '@/components/SidePanel';

export default function Home() {
  return (
    <div className="h-[calc(100vh-48px)] flex">
      <PanelGroup direction="horizontal" autoSaveId="arenaqa-layout" className="flex-1">
        {/* 左侧：输入面板 */}
        <Panel defaultSize={25} minSize={20} maxSize={40}>
          <div className="h-full bg-[var(--color-surface)] border-r border-[var(--color-divider)] rounded-r-2xl overflow-hidden">
            <InputPanel />
          </div>
        </Panel>

        <PanelResizeHandle>
          <div className="w-[6px] h-full flex items-center justify-center group cursor-col-resize bg-transparent">
            <div className="w-0.5 h-10 rounded-full bg-[var(--color-divider)] group-hover:bg-[var(--color-primary)] group-hover:w-1 transition-all duration-200" />
          </div>
        </PanelResizeHandle>

        {/* 中间：多列回答区 */}
        <Panel defaultSize={50} minSize={30}>
          <div className="h-full bg-gradient-to-br from-[var(--color-bg)] to-[var(--color-surface)] p-4">
            <div className="h-full rounded-2xl overflow-hidden modern-card">
              <ColumnLayout />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle>
          <div className="w-[6px] h-full flex items-center justify-center group cursor-col-resize bg-transparent">
            <div className="w-0.5 h-10 rounded-full bg-[var(--color-divider)] group-hover:bg-[var(--color-primary)] group-hover:w-1 transition-all duration-200" />
          </div>
        </PanelResizeHandle>

        {/* 右侧：摘要面板 */}
        <Panel defaultSize={25} minSize={20} maxSize={40}>
          <div className="h-full bg-[var(--color-surface)] border-l border-[var(--color-divider)] rounded-l-2xl overflow-hidden">
            <SidePanel />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
