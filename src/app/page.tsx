"use client";

import { useState, useEffect, useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/useChat";
import { InputPanel } from "@/components/InputPanel";
import { AnswerColumn } from "@/components/AnswerColumns/AnswerColumn";
import { PlaceholderCard } from "@/components/AnswerColumns/PlaceholderCard";
import { ScoreCard } from "@/components/SidePanel/ScoreCard";
import { FusionBox } from "@/components/SidePanel/FusionBox";
import { CostSummary } from "@/components/SidePanel/CostSummary";
import { SettingsModal } from "@/components/shared/SettingsModal";
import { HistoryList } from "@/components/shared/HistoryList";
import { PromptInputBar } from "@/components/PromptInputBar";
import { MobileNav } from "@/components/MobileNav";

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
  const lastPrompt = useChatStore((s) => s.lastPrompt);
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

  // 设置面板 + 历史栏 + 左栏切换 + 评分状态
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reJudging, setReJudging] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [leftTab, setLeftTab] = useState<"models" | "history">("models");
  const [mobileTab, setMobileTab] = useState<"models" | "chat" | "results">("chat");

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const hasAnswers = Object.keys(answers).length > 0;
  const hasResults = scores.length > 0;
  const answerModels = [...new Set([...selectedModels, ...Object.keys(answers)])];

  return (
    <div className="h-dvh bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">AQ</div>
          <div>
            <div className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">ArenaQA</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">AI 问答竞技场</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 移动端历史按钮 */}
          <button
            type="button"
            onClick={() => setHistoryCollapsed((v) => !v)}
            className="md:hidden w-8 h-8 max-md:w-10 max-md:h-10 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
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
              className="w-8 h-8 max-md:w-10 max-md:h-10 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="3" /></svg>
            </button>
          )}

          <button type="button" onClick={() => setSettingsOpen(true)} title="设置"
            className="w-8 h-8 max-md:w-10 max-md:h-10 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          <button type="button" onClick={toggleTheme} title={dark ? "切换亮色" : "切换暗色"}
            className="w-8 h-8 max-md:w-10 max-md:h-10 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-colors">
            {dark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 pb-14 md:pb-0" style={{ maxWidth: 2200, margin: "0 auto" }}>
        <div className="flex-1 px-3 lg:px-4 py-3 lg:py-4 grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr_320px] grid-rows-1 gap-3 lg:gap-4 min-w-0 min-h-0">
        {/* Left: Models / History tabs */}
        <section className={`min-h-0 flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in ${mobileTab === "models" ? "flex" : "hidden"} md:flex`}>
          <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
            <button
              type="button"
              onClick={() => setLeftTab("models")}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                leftTab === "models"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              参赛模型
            </button>
            <button
              type="button"
              onClick={() => setLeftTab("history")}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                leftTab === "history"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              历史会话
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {leftTab === "models" ? <InputPanel /> : <HistoryList />}
          </div>
        </section>

        {/* Center: Answers + Input */}
        <section className={`min-h-0 flex-col min-w-0 animate-fade-in ${mobileTab === "chat" ? "flex" : "hidden"} md:flex`}>
          <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">模型回答</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">{answerModels.length} 个模型</span>
              </div>
              {lastPrompt && hasAnswers && (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">问: {lastPrompt}</div>
              )}
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {!hasAnswers && selectedModels.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-16">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="mb-4 opacity-30">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                  </svg>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">选择参赛模型</div>
                  <div className="text-xs dark:text-gray-400 mb-4">最多支持 6 个 AI 同时对决</div>
                  <button
                    onClick={() => { setLeftTab("models"); setMobileTab("models"); }}
                    className="px-4 py-2 text-xs font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    去添加模型
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  {answerModels.map((model) => (
                    <AnswerColumn key={model} model={model} />
                  ))}
                  {Array.from({ length: Math.max(0, 6 - answerModels.length) }).map((_, i) => (
                    <PlaceholderCard
                      key={`placeholder-${i}`}
                      index={i}
                      onClick={() => { setLeftTab("models"); setMobileTab("models"); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <PromptInputBar />
        </section>

        {/* Right: Results */}
        <section className={`min-h-0 animate-fade-in ${mobileTab === "results" ? "block" : "hidden"} lg:block`}>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">评分与融合</h3>
              {hasAnswers && (
                <button
                  disabled={reJudging}
                  onClick={async () => {
                    setReJudging(true);
                    const state = useChatStore.getState();
                    const answersArr = Object.entries(state.answers).map(([model, a]) => ({
                      model,
                      content: a.content,
                    }));
                    // 从 localStorage 读 DeepSeek Key 传给后端
                    const dsKey = localStorage.getItem('arenaqa-DEEPSEEK_API_KEY');
                    try {
                      const res = await fetch('/api/judge', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          prompt: state.lastPrompt,
                          answers: answersArr,
                          apiKey: dsKey || undefined,
                          baseUrl: 'https://api.deepseek.com/v1',
                          modelId: 'deepseek-chat',
                        }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        console.log('[reJudge] got', data.scores?.length, 'scores, fusion:', !!data.fusion);
                        console.log('[reJudge] first score:', JSON.stringify(data.scores?.[0]));
                        useChatStore.setState({ scores: data.scores, fusion: data.fusion });

                        // 保存评分结果到历史记录
                        const historyId = useChatStore.getState().currentHistoryId;
                        if (historyId) {
                          fetch(`/api/history/${historyId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ scores: data.scores, fusion: data.fusion }),
                          }).catch((e) => { console.warn('[reJudge] history PATCH failed', e); });
                        }
                      }
                    } catch (e) { console.warn('[reJudge] fetch error', e); }
                    setReJudging(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${reJudging ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/30'}`}
                >
                  {reJudging ? '评分中...' : '重新评分'}
                </button>
              )}
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {!hasResults ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-10">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="mb-2 opacity-40"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">等待评分</div>
                  <div className="text-xs dark:text-gray-400">所有模型回答完成后，AI 裁判将自动评分并生成综合答案</div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">模型评分</div>
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

      {/* Mobile Bottom Nav */}
      <MobileNav activeTab={mobileTab} onTabChange={setMobileTab} hasResults={hasResults} />

      {/* Mobile History Overlay */}
      {!historyCollapsed && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/20 dark:bg-black/50" onClick={() => setHistoryCollapsed(true)} />
          <div className="w-[260px] h-dvh bg-white dark:bg-gray-800 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">历史记录</h3>
              <button onClick={() => setHistoryCollapsed(true)} className="w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>
            <HistoryList />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
