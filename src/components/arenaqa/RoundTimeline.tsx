"use client";

import { useChatStore } from "@/stores/chat-store";

export function RoundTimeline() {
  const rounds = useChatStore((s) => s.rounds);
  const selectedRound = useChatStore((s) => s.selectedRound);
  const selectRound = useChatStore((s) => s.selectRound);
  const status = useChatStore((s) => s.status);
  const lastPrompt = useChatStore((s) => s.lastPrompt);
  const conversationId = useChatStore((s) => s.conversationId);

  // 如果有活跃对话且还没结束，加一个"当前轮"的占位
  const allRounds = [
    ...rounds,
    ...(conversationId && status !== "idle" && !rounds.find((r) => r.round === (rounds.length + 1))
      ? [{ round: rounds.length + 1, prompt: lastPrompt, answers: [], scores: [], fusion: null }]
      : []),
  ];

  if (allRounds.length === 0 && status === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 px-1 pb-3 overflow-x-auto shrink-0">
      {allRounds.map((r) => {
        const isSelected = r.round === selectedRound;
        const isLatest = r.round === allRounds.length;
        const isActive = isLatest && status !== "idle" && status !== "complete";

        return (
          <button
            key={r.round}
            type="button"
            onClick={() => selectRound(r.round)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0
              ${isSelected
                ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }
              ${isActive ? "animate-pulse border-indigo-400" : ""}
            `}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isSelected
                ? "bg-indigo-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            }`}>
              {r.round}
            </span>
            <span className="max-w-[120px] truncate">
              {r.prompt || `Round ${r.round}`}
            </span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
