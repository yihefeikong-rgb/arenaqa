"use client";

import { useChatStore } from "@/stores/chat-store";
import { AnswerColumn } from "./AnswerColumn";
import { PlaceholderCard } from "./PlaceholderCard";

interface Props {
  onAddModel: () => void;
}

export function AnswerGrid({ onAddModel }: Props) {
  const answers = useChatStore((s) => s.answers);
  const selectedModels = useChatStore((s) => s.selectedModels);
  const lastPrompt = useChatStore((s) => s.lastPrompt);

  const hasAnswers = Object.keys(answers).length > 0;
  const answerModels = [...new Set([...selectedModels, ...Object.keys(answers)])];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 pb-3 shrink-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">模型回答</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">{answerModels.length} 个模型</span>
        {lastPrompt && hasAnswers && (
          <span className="text-xs text-gray-400 dark:text-gray-500 truncate ml-2">问: {lastPrompt}</span>
        )}
      </div>
      {!hasAnswers && selectedModels.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-gray-400 dark:text-gray-500 py-16">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="mb-4 opacity-30">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
          </svg>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">选择参赛模型</div>
          <div className="text-xs dark:text-gray-400 mb-4">最多支持 6 个 AI 同时对决</div>
          <button
            onClick={onAddModel}
            className="px-4 py-2 text-xs font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            去添加模型
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {answerModels.map((model) => (
              <AnswerColumn key={model} model={model} />
            ))}
            {Array.from({ length: Math.max(0, 6 - answerModels.length) }).map((_, i) => (
              <PlaceholderCard
                key={`placeholder-${i}`}
                index={i}
                onClick={onAddModel}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
