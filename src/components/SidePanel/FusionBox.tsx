"use client";

import type { FusionResult } from "@/types";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

const MODEL_META: Record<string, { name: string; icon: string }> = {
  deepseek: { name: "DeepSeek V3", icon: "D" },
  qwen: { name: "通义千问", icon: "Q" },
  claude: { name: "Claude", icon: "C" },
  gemini: { name: "Gemini", icon: "G" },
};

const MODEL_GRADIENT: Record<string, string> = {
  deepseek: "from-blue-500 to-cyan-500",
  qwen: "from-violet-500 to-pink-500",
  claude: "from-amber-500 to-orange-500",
  gemini: "from-emerald-500 to-teal-500",
};

interface Props {
  fusion: FusionResult;
}

export function FusionBox({ fusion }: Props) {
  return (
    <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 rounded-lg p-4 mt-4">
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full mb-3">
        AI 融合答案
      </span>

      {fusion.consensus.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">共识观点</div>
          {fusion.consensus.map((c, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400 mb-1 leading-relaxed">
              <span className="text-emerald-500 font-bold mt-0.5 shrink-0">&#10003;</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      )}

      {fusion.divergences.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">分歧焦点</div>
          {fusion.divergences.map((d, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700/50 rounded-md p-2.5 mb-2">
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5">{d.topic}</div>
              {Object.entries(d.positions).map(([model, pos]) => (
                <div key={model} className="flex gap-2 text-[11px] mb-0.5">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[90px] shrink-0">
                    <span className={`inline-block w-4 h-4 rounded bg-gradient-to-br ${MODEL_GRADIENT[model] || "from-gray-500 to-gray-600"} text-white text-[8px] leading-4 text-center mr-0.5 align-middle`}>
                      {MODEL_META[model]?.icon || "?"}
                    </span>
                    {MODEL_META[model]?.name || model}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">{pos}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">综合答案</div>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <MarkdownRenderer content={fusion.synthesized} />
        </div>
      </div>

      <div className="flex justify-end mt-3">
        <button
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 transition-colors flex items-center gap-1"
          onClick={() => navigator.clipboard.writeText(fusion.synthesized)}
        >
          复制
        </button>
      </div>
    </div>
  );
}
