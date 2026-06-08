"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/useChat";
import { ModelCard } from "./ModelCard";

export function InputPanel() {
  const [prompt, setPrompt] = useState("");
  const [modelEnabled, setModelEnabled] = useState<Record<string, boolean>>({});
  const selectedModels = useChatStore((s) => s.selectedModels);
  const status = useChatStore((s) => s.status);
  const { sendChat } = useChat();

  // 获取模型配置状态
  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => {
        const enabled: Record<string, boolean> = {};
        data.models?.forEach((m: { name: string; enabled: boolean }) => {
          enabled[m.name] = m.enabled;
        });
        setModelEnabled(enabled);
      })
      .catch(() => {
        // 获取失败时全部标为已配置，不阻塞使用
        setModelEnabled({ deepseek: true, qwen: true, claude: true, gemini: true });
      });
  }, []);

  const canSend = prompt.trim().length > 0 && selectedModels.length > 0 && status === "idle";

  const handleSend = () => {
    if (!canSend) return;
    sendChat(prompt, selectedModels);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const btnLabel =
    status === "streaming" ? "生成中..."
    : status === "judging" ? "评分中..."
    : status === "fusing" ? "融合中..."
    : "发起对比";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">选择参赛模型</h3>
        <span className="text-xs text-gray-500">{selectedModels.length}/4</span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {["deepseek", "qwen", "claude", "gemini"].map((model) => (
            <ModelCard
              key={model}
              model={model}
              enabled={modelEnabled[model] ?? true}
            />
          ))}
        </div>

        <div className="mt-5">
          <label className="text-sm font-semibold text-gray-900 block mb-2">输入问题</label>
          <div className="relative">
            <textarea
              className="w-full min-h-[100px] resize-y p-3 pb-7 border-[1.5px] border-gray-200 rounded-lg text-sm bg-white text-gray-800 transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="什么是量子计算？它与传统计算机有什么区别？"
              maxLength={4000}
            />
            <span className="absolute bottom-2 right-3 text-[11px] text-gray-400">{prompt.length} / 4000</span>
          </div>
        </div>

        <button
          type="button"
          disabled={!canSend}
          onClick={handleSend}
          className={`w-full mt-3 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 transition-all ${
            canSend
              ? "bg-indigo-500 text-white hover:bg-indigo-600 active:bg-indigo-700 hover:shadow-sm"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {status !== "idle" && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {btnLabel}
        </button>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 leading-relaxed">
          <strong className="text-gray-700">提示</strong><br />
          选择 2-4 个模型进行对比。未配置 API Key 的模型将显示为不可选状态。
        </div>
      </div>
    </div>
  );
}
