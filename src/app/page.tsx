"use client";

import { useState, useEffect, useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/useChat";
import { InputPanel } from "@/components/InputPanel";
import { AnswerColumn } from "@/components/AnswerColumns/AnswerColumn";
import { ScoreCard } from "@/components/SidePanel/ScoreCard";
import { FusionBox } from "@/components/SidePanel/FusionBox";
import { CostSummary } from "@/components/SidePanel/CostSummary";
import { SettingsModal } from "@/components/shared/SettingsModal";
import { HistorySidebar } from "@/components/shared/HistorySidebar";

const STATUS_CONFIG: Record<string, { label: string; dotColor: string; bg: string; border: string; textColor: string }> = {
  idle: { label: "就绪", dotColor: "bg-gray-400", bg: "bg-gray-100", border: "border-gray-200", textColor: "text-gray-600" },
  streaming: { label: "流式接收中", dotColor: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", textColor: "text-emerald-700" },
  judging: { label: "AI 裁判评分中", dotColor: "bg-amber-500", bg: "bg-amber-50", border: "border-amber-200", textColor: "text-amber-700" },
  fusing: { label: "融合分析中", dotColor: "bg-indigo-500", bg: "bg-indigo-50", border: "border-indigo-200", textColor: "text-indigo-700" },
  complete: { label: "已完成", dotColor: "bg-blue-500", bg: "bg-blue-50", border: "border-blue-200", textColor: "text-blue-700" },
};

export default function Home() {
  const status = useChatStore((s) => s.status);
  const selectedModels = useChatStore((s) => s.selectedModels);
  const answers = useChatStore((s) => s.answers);
  const scores = useChatStore((s) => s.scores);
  const fusion = useChatStore((s) => s.fusion);
  const { abortChat } = useChat();

  // 主题
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("arenaqa-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("arenaqa-theme", next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  // 设置面板 + 历史栏
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const hasAnswers = Object.keys(answers).length > 0;
  const hasResults = scores.length > 0;
  // 显示当前选中或已有回答的模型（去重），确保发送后立刻看到每个模型的卡片
  const answerModels = [...new Set([...selectedModels, ...Object.keys(answers)])];
  const cols = answerModels.length <= 2 ? 1 : 2;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">AQ</div>
          <div>
            <div className="text-base font-bold text-gray-900 leading-tight">ArenaQA</div>
            <div className="text-[11px] text-gray-500">AI 问答竞技场</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 移动端历史按钮 */}
          <button
            type="button"
            onClick={() => setHistoryCollapsed((v) => !v)}
            className="md:hidden w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
            title="历史记录"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </button>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.bg} ${config.textColor} ${config.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${status === "streaming" ? "animate-pulse" : ""}`} />
            {config.label}
          </div>

          {status !== "idle" && (
            <button type="button" onClick={abortChat} title="中断"
              className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="3" /></svg>
            </button>
          )}

          <button type="button" onClick={() => setSettingsOpen(true)} title="设置"
            className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          <button type="button" onClick={toggleTheme} title={dark ? "切换亮色" : "切换暗色"}
            className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors">
            {dark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1" style={{ maxWidth: 2200, margin: "0 auto" }}>
        <div className="hidden md:block">
          <HistorySidebar collapsed={historyCollapsed} onToggle={() => setHistoryCollapsed((v) => !v)} />
        </div>

        <div className="flex-1 px-3 lg:px-4 py-3 lg:py-4 grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-3 lg:gap-4 min-w-0">
        {/* Left: Input */}
        <section className="min-h-0">
          <InputPanel />
        </section>

        {/* Center: Answers */}
        <section className="min-h-0 flex flex-col">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col flex-1">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 shrink-0">
              <h3 className="text-sm font-semibold text-gray-900">模型回答</h3>
              <span className="text-xs text-gray-500">{answerModels.length} 个模型</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {!hasAnswers ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="mb-3 opacity-40"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  <div className="text-sm font-semibold text-gray-600 mb-1">准备开始</div>
                  <div className="text-xs">选择模型并输入问题，点击发起对比查看各模型回答</div>
                </div>
              ) : (
                <div className={`grid gap-4 ${cols === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {answerModels.map((model) => (
                    <AnswerColumn key={model} model={model} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right: Results */}
        <section className="min-h-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-200 shrink-0">
              <h3 className="text-sm font-semibold text-gray-900">评分与融合</h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {!hasResults ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="mb-2 opacity-40"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  <div className="text-sm font-semibold text-gray-600 mb-1">等待评分</div>
                  <div className="text-xs">所有模型回答完成后，AI 裁判将自动评分并生成综合答案</div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-3">模型评分</div>
                  {scores.map((score, i) => (
                    <ScoreCard key={score.model} score={score} index={i} />
                  ))}
                  {fusion && <FusionBox fusion={fusion} />}
                  <CostSummary />
                </div>
              )}
            </div>
          </div>
        </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-xs text-gray-400 flex-shrink-0">
        ArenaQA · Next.js 15 · SSE 流式
      </footer>

      {/* Mobile History Overlay */}
      {!historyCollapsed && (
        <div className="md:hidden fixed inset-0 z-40 flex" onClick={() => setHistoryCollapsed(true)}>
          <div className="flex-1 bg-black/20" onClick={() => setHistoryCollapsed(true)} />
          <div className="w-[260px] h-dvh bg-white" onClick={(e) => e.stopPropagation()}>
            <HistorySidebar collapsed={false} onToggle={() => setHistoryCollapsed(true)} />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
