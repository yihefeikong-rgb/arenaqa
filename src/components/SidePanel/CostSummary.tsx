"use client";

import { useChatStore } from "@/stores/chat-store";

// 每 1K tokens 价格 (USD)，用于成本估算
// 中文约 1 字 ≈ 1 token
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  deepseek: { input: 0.00014, output: 0.00028 },
  qwen: { input: 0.0005, output: 0.002 },
  claude: { input: 0.003, output: 0.015 },
  gemini: { input: 0.000125, output: 0.000375 },
};

const MODEL_NAMES: Record<string, string> = {
  deepseek: "DeepSeek",
  qwen: "千问",
  claude: "Claude",
  gemini: "Gemini",
};

function estimateCost(model: string, charCount: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  // 估算：prompt ~200 中文字，回答 ~charCount 字
  const inputTokens = 200;
  const outputTokens = Math.round(charCount * 1.2);
  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
}

export function CostSummary() {
  const answers = useChatStore((s) => s.answers);
  const status = useChatStore((s) => s.status);

  const entries = Object.entries(answers)
    .filter(([, a]) => a.status === "done" || a.status === "error")
    .map(([model, answer]) => {
      const charCount = answer.content?.length || 0;
      const cost = estimateCost(model, charCount);
      return { model, name: MODEL_NAMES[model] || model, charCount, cost };
    });

  if (entries.length === 0 && status !== "complete") return null;

  const totalCost = entries.reduce((s, e) => s + e.cost, 0);

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">成本估算</h4>
      <div className="space-y-1.5">
        {entries.map((e) => (
          <div key={e.model} className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{e.name}</span>
            <span className="text-gray-400">{e.charCount} 字</span>
            <span className="text-gray-700 font-mono font-medium">${e.cost.toFixed(4)}</span>
          </div>
        ))}
      </div>
      {totalCost > 0 && (
        <div className="flex items-center justify-between text-xs font-semibold mt-2 pt-2 border-t border-gray-100">
          <span className="text-gray-700">会话总计</span>
          <span className="text-indigo-600 font-mono">${totalCost.toFixed(4)}</span>
        </div>
      )}
      <p className="text-[10px] text-gray-400 mt-1.5">基于字数估算，实际费用以 API 账单为准</p>
    </div>
  );
}
