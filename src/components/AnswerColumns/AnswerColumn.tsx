"use client";

import { useChatStore } from "@/stores/chat-store";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

const MODEL_COLORS: Record<string, string> = {
  deepseek: "bg-gradient-to-r from-blue-600 to-blue-500",
  qwen: "bg-gradient-to-r from-violet-600 to-purple-500",
  claude: "bg-gradient-to-r from-amber-600 to-orange-500",
  gemini: "bg-gradient-to-r from-emerald-600 to-teal-500",
};

const MODEL_META: Record<string, { name: string; icon: string }> = {
  deepseek: { name: "DeepSeek V3", icon: "D" },
  qwen: { name: "通义千问", icon: "Q" },
  claude: { name: "Claude", icon: "C" },
  gemini: { name: "Gemini", icon: "G" },
};

interface Props {
  model: string;
}

export function AnswerColumn({ model }: Props) {
  const { answers } = useChatStore();
  const answer = answers[model];
  const meta = MODEL_META[model];

  if (!answer || !meta) return null;

  const isStreaming = answer.status === "streaming";
  const isError = answer.status === "error";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-sm transition-shadow">
      <div className={`px-4 py-2.5 flex items-center gap-2 text-white font-semibold text-sm ${MODEL_COLORS[model] || "bg-gray-600"}`}>
        <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">
          {meta.icon}
        </div>
        <span>{meta.name}</span>
        {answer.latencyMs != null && (
          <span className="ml-auto text-[11px] opacity-85 font-medium">{(answer.latencyMs / 1000).toFixed(1)}s</span>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto max-h-[500px]">
        {isStreaming && answer.content === "" ? (
          <div className="space-y-2">
            {[90, 70, 85, 60, 75].map((w, i) => (
              <div key={i} className="h-3.5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : isError ? (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 text-sm">{answer.error || "生成失败"}</p>
          </div>
        ) : (
          <MarkdownRenderer content={answer.content} streaming={isStreaming} />
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500">
        <span>
          {answer.status === "done"
            ? `${answer.content.length} 字符 · ${((answer.latencyMs ?? 0) / 1000).toFixed(1)}s`
            : isStreaming ? `${answer.content.length} 字符 · 生成中...` : "等待中..."
          }
        </span>
        <button
          className="px-2.5 py-1 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs"
          onClick={() => navigator.clipboard.writeText(answer.content)}
        >
          复制
        </button>
      </div>
    </div>
  );
}
