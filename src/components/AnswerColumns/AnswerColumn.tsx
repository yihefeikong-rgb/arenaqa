"use client";

import { useState, useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/useChat";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

const MODEL_COLORS: Record<string, string> = {
  deepseek: "bg-blue-500",
  qwen: "bg-violet-500",
  claude: "bg-amber-500",
  gemini: "bg-emerald-500",
};

const MODEL_META: Record<string, { name: string; icon: string }> = {
  deepseek: { name: "DeepSeek", icon: "D" },
  qwen: { name: "千问", icon: "Q" },
  claude: { name: "Claude", icon: "C" },
  gemini: { name: "Gemini", icon: "G" },
};

const DISLIKE_TAGS = ["事实错误", "逻辑混乱", "不完整", "表达不清", "其他"];

interface Props {
  model: string;
}

function getMeta(model: string): { name: string; icon: string } {
  return MODEL_META[model] || {
    name: model.replace(/^nim-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: model.slice(0, 2).toUpperCase(),
  };
}

export function AnswerColumn({ model }: Props) {
  const answers = useChatStore((s) => s.answers);
  const lastPrompt = useChatStore((s) => s.lastPrompt);
  const { stopModel, retryModel } = useChat();
  const answer = answers[model];
  const meta = getMeta(model);

  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [showDislikeDialog, setShowDislikeDialog] = useState(false);
  const [dislikeTags, setDislikeTags] = useState<string[]>([]);
  const [dislikeComment, setDislikeComment] = useState("");

  const submitFeedback = useCallback(
    async (type: "like" | "dislike", tags: string[] = []) => {
      if (feedback) return;
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
      } catch { /* ignore */ }
    },
    [feedback, model, lastPrompt, answer, dislikeComment]
  );

  const isNim = model.startsWith("nim-");
  const color = MODEL_COLORS[model] || (isNim ? "bg-green-500" : "bg-gray-500");

  if (!answer) {
    // 已选中但尚未发送/收到回答 — 等待状态
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900">{meta.name}</div>
            <div className="text-[11px] text-gray-400">等待发送...</div>
          </div>
          <div className="w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isStreaming = answer.status === "streaming";
  const isError = answer.status === "error";
  const isStopped = answer.status === "stopped";
  const hasContent = answer.content?.length > 0;

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-colors ${isStreaming ? "border-indigo-300 animate-pulse-border" : "border-gray-200"}`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900">{meta.name}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            {isStreaming && <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 生成中...</>}
            {isStopped && <><span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> 已停止</>}
            {isError && <><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> 生成失败</>}
            {answer.status === "done" && <><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> 已完成{answer.latencyMs ? ` · ${(answer.latencyMs / 1000).toFixed(1)}s` : ""}</>}
          </div>
        </div>
        {/* 操作按钮 */}
        <div className="flex items-center gap-1">
          {lastPrompt && (
            <span className="text-[10px] text-gray-300 hidden lg:block truncate max-w-[100px]">{lastPrompt.slice(0, 20)}</span>
          )}
          {isStreaming && (
            <button onClick={() => stopModel(model)}
              className="px-2 py-1 rounded-md text-[11px] font-medium border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors">
              停止
            </button>
          )}
          {(isStopped || isError) && (
            <button onClick={() => retryModel(model)}
              className="px-2 py-1 rounded-md text-[11px] font-medium border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors">
              重试
            </button>
          )}
        </div>
      </div>

      {/* 回答内容 */}
      <div className="px-4 py-3">
        {isStreaming && !hasContent ? (
          <div className="space-y-2">
            {[88, 72, 90, 60, 78].map((w, i) => (
              <div key={i} className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : isError ? (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">{answer.error || "请求失败，请检查 API Key 配置"}</p>
          </div>
        ) : isStopped && !hasContent ? (
          <div className="text-sm text-gray-400 italic text-center py-4">已停止</div>
        ) : (
          <MarkdownRenderer content={answer.content} streaming={isStreaming} />
        )}
      </div>

      {/* 底部工具栏 */}
      {(answer.status === "done" || hasContent) && (
        <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              className={`px-2 py-1 rounded-md text-[11px] border transition-colors ${feedback === "like" ? "bg-green-50 border-green-200 text-green-600" : "border-gray-200 text-gray-400 hover:text-green-500 hover:border-green-200"}`}
              onClick={() => submitFeedback("like")}
              disabled={feedback !== null}
            >
              有用 {feedback === "like" ? "✓" : ""}
            </button>
            <button
              className={`px-2 py-1 rounded-md text-[11px] border transition-colors ${feedback === "dislike" ? "bg-red-50 border-red-200 text-red-500" : "border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200"}`}
              onClick={() => !feedback && setShowDislikeDialog(true)}
              disabled={feedback !== null}
            >
              没用 {feedback === "dislike" ? "✓" : ""}
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-300">{answer.content.length} 字</span>
            {hasContent && (
              <button
                className="px-2 py-1 rounded-md text-[11px] border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                onClick={() => navigator.clipboard.writeText(answer.content)}
              >
                复制
              </button>
            )}
          </div>
        </div>
      )}

      {/* 点踩反馈弹窗 */}
      {showDislikeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowDislikeDialog(false)}>
          <div className="bg-white rounded-xl p-5 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">反馈原因</h4>
            <p className="text-xs text-gray-500 mb-3">选择你认为存在的问题（可多选）</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {DISLIKE_TAGS.map((tag) => (
                <button key={tag}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${dislikeTags.includes(tag) ? "bg-red-50 border-red-300 text-red-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  onClick={() => setDislikeTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag])}
                >
                  {tag}
                </button>
              ))}
            </div>
            <textarea className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs resize-none bg-gray-50 focus:outline-none focus:border-indigo-400 mb-3" rows={2}
              placeholder="补充说明（可选）" value={dislikeComment} onChange={(e) => setDislikeComment(e.target.value)} maxLength={500} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowDislikeDialog(false); setDislikeTags([]); setDislikeComment(""); }}
                className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={() => { submitFeedback("dislike", dislikeTags); setShowDislikeDialog(false); }}
                className="px-3 py-1.5 rounded-lg text-xs bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
