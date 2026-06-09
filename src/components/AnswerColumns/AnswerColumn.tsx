"use client";

import { useState, useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/useChat";
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

const DISLIKE_TAGS = ["事实错误", "逻辑混乱", "不完整", "表达不清", "其他"];

export function AnswerColumn({ model }: Props) {
  const answers = useChatStore((s) => s.answers);
  const lastPrompt = useChatStore((s) => s.lastPrompt);
  const { stopModel, retryModel } = useChat();
  const answer = answers[model];
  const meta = MODEL_META[model];

  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [showDislikeDialog, setShowDislikeDialog] = useState(false);
  const [dislikeTags, setDislikeTags] = useState<string[]>([]);
  const [dislikeComment, setDislikeComment] = useState("");

  const submitFeedback = useCallback(
    async (type: "like" | "dislike", tags: string[] = []) => {
      if (feedback) return; // 已反馈
      setFeedback(type);
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            prompt: lastPrompt,
            answer: answer?.content || "",
            type,
            tags,
            comment: type === "dislike" ? dislikeComment : undefined,
          }),
        });
      } catch {
        // 提交失败不回退 UI
      }
    },
    [feedback, model, lastPrompt, answer, dislikeComment]
  );

  if (!meta) return null;

  if (!answer) {
    // 模型已选中但尚未收到回答 — 显示等待卡片
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        <div className={`px-4 py-2.5 flex items-center gap-2 text-white font-semibold text-sm ${MODEL_COLORS[model] || "bg-gray-600"}`}>
          <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">{meta.icon}</div>
          <span>{meta.name}</span>
          <span className="ml-auto text-[11px] opacity-75">准备中</span>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {[90, 70, 85, 60, 75].map((w, i) => (
              <div key={i} className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isStreaming = answer.status === "streaming";
  const isError = answer.status === "error";
  const isStopped = answer.status === "stopped";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-sm transition-shadow">
      <div className={`px-4 py-2.5 flex items-center gap-2 text-white font-semibold text-sm ${MODEL_COLORS[model] || "bg-gray-600"}`}>
        <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-[10px] font-bold shrink-0">
          {meta.icon}
        </div>
        <span>{meta.name}</span>
        {isStopped && (
          <span className="ml-auto text-[11px] opacity-75 font-normal bg-white/20 px-1.5 py-0.5 rounded">已停止</span>
        )}
        {answer.latencyMs != null && !isStopped && (
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
            : isStreaming ? `${answer.content.length} 字符 · 生成中...`
            : isStopped ? "已停止"
            : "等待中..."
          }
        </span>
        <div className="flex items-center gap-1.5">
          {isStreaming && (
            <button
              className="px-2 py-1 rounded border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors text-xs font-medium"
              onClick={() => stopModel(model)}
            >
              停止
            </button>
          )}
          {(isStopped || isError) && (
            <button
              className="px-2 py-1 rounded border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors text-xs font-medium"
              onClick={() => retryModel(model)}
            >
              重试
            </button>
          )}
          {answer.status === "done" && (
            <>
              <button
                className={`px-2 py-1 rounded border transition-colors text-xs ${feedback === "like" ? "bg-green-50 border-green-300 text-green-600" : "border-gray-200 hover:bg-gray-50 text-gray-500"}`}
                onClick={() => submitFeedback("like")}
                disabled={feedback !== null}
                title="有用"
              >
                &#x1F44D; {feedback === "like" ? "已赞" : ""}
              </button>
              <button
                className={`px-2 py-1 rounded border transition-colors text-xs ${feedback === "dislike" ? "bg-red-50 border-red-300 text-red-600" : "border-gray-200 hover:bg-gray-50 text-gray-500"}`}
                onClick={() => {
                  if (feedback) return;
                  setShowDislikeDialog(true);
                }}
                disabled={feedback !== null}
                title="踩"
              >
                &#x1F44E; {feedback === "dislike" ? "已踩" : ""}
              </button>
            </>
          )}
          {answer.content && (
            <button
              className="px-2.5 py-1 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs"
              onClick={() => navigator.clipboard.writeText(answer.content)}
            >
              复制
            </button>
          )}
        </div>
      </div>

      {/* 点踩反馈弹窗 */}
      {showDislikeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowDislikeDialog(false)}>
          <div className="bg-white rounded-xl p-5 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">反馈原因</h4>
            <p className="text-xs text-gray-500 mb-3">选择你认为存在的问题（可多选）</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {DISLIKE_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${dislikeTags.includes(tag) ? "bg-red-50 border-red-300 text-red-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  onClick={() =>
                    setDislikeTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                    )
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
            <textarea
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs resize-none bg-gray-50 focus:outline-none focus:border-indigo-400 mb-3"
              rows={2}
              placeholder="补充说明（可选）"
              value={dislikeComment}
              onChange={(e) => setDislikeComment(e.target.value)}
              maxLength={500}
            />
            <div className="flex gap-2 justify-end">
              <button
                className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setShowDislikeDialog(false);
                  setDislikeTags([]);
                  setDislikeComment("");
                }}
              >
                取消
              </button>
              <button
                className="px-3 py-1.5 rounded-lg text-xs bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                onClick={() => {
                  submitFeedback("dislike", dislikeTags);
                  setShowDislikeDialog(false);
                }}
              >
                提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
