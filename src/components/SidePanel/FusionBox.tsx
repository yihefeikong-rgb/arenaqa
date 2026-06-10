"use client";

import { useState } from "react";
import type { FusionResult } from "@/types";
import dynamic from "next/dynamic";

const MarkdownRenderer = dynamic(() => import("@/components/ui/MarkdownRenderer"), { ssr: false });

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

type FusionTab = "consensus" | "divergence" | "synthesized";

const TABS: { key: FusionTab; label: string }[] = [
  { key: "consensus", label: "共识观点" },
  { key: "divergence", label: "分歧焦点" },
  { key: "synthesized", label: "综合答案" },
];

function DivergenceCard({ divergence }: { divergence: FusionResult["divergences"][0] }) {
  return (
    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-lg p-3">
      <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-3">{divergence.topic}</div>
      <div className="space-y-3">
        {Object.entries(divergence.positions).map(([model, pos]) => (
          <div key={model} className="border-l-2 border-indigo-200 dark:border-indigo-700 pl-3">
            <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5 flex items-center gap-1">
              <span className={`inline-block w-3.5 h-3.5 rounded bg-gradient-to-br ${MODEL_GRADIENT[model] || "from-gray-500 to-gray-600"} text-white text-[7px] leading-3.5 text-center`}>
                {MODEL_META[model]?.icon || "?"}
              </span>
              {MODEL_META[model]?.name || model}
            </div>
            <div className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{pos}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FusionBox({ fusion }: Props) {
  const [tab, setTab] = useState<FusionTab>("synthesized");
  const [divIndex, setDivIndex] = useState(0);

  return (
    <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/30 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-3 pt-3 pb-0">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full mb-2">
          AI 融合答案
        </span>
        {/* 内部 tabs */}
        <div className="flex gap-1 mt-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                tab === t.key
                  ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body — 固定高度，每个 tab 内容独立滚动 */}
      <div className="p-3">
        <div className="h-[420px] overflow-y-auto">
          {tab === "consensus" && (
            <div className="space-y-1.5">
              {fusion.consensus.length > 0 ? (
                fusion.consensus.map((c, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    <span className="text-emerald-500 font-bold mt-0.5 shrink-0">&#10003;</span>
                    <span>{c}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 py-4 text-center">无共识观点</div>
              )}
            </div>
          )}

          {tab === "divergence" && (
            <div>
              {fusion.divergences.length > 0 ? (
                <div>
                  <DivergenceCard divergence={fusion.divergences[divIndex]} />
                  {fusion.divergences.length > 1 && (
                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => setDivIndex((p) => Math.max(0, p - 1))}
                        disabled={divIndex === 0}
                        className="px-2 py-0.5 rounded text-[10px] border border-gray-200 dark:border-gray-600 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        ← 前一个
                      </button>
                      <div className="flex items-center gap-1">
                        {fusion.divergences.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setDivIndex(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              i === divIndex ? "bg-indigo-400 w-3" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => setDivIndex((p) => Math.min(fusion.divergences.length - 1, p + 1))}
                        disabled={divIndex === fusion.divergences.length - 1}
                        className="px-2 py-0.5 rounded text-[10px] border border-gray-200 dark:border-gray-600 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        后一个 →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-400 py-4 text-center">无分歧焦点</div>
              )}
            </div>
          )}

          {tab === "synthesized" && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <MarkdownRenderer content={fusion.synthesized} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {tab === "synthesized" && (
        <div className="px-3 pb-3 flex justify-end">
          <button
            className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-[10px] text-gray-500 dark:text-gray-400 transition-colors flex items-center gap-1"
            onClick={() => navigator.clipboard.writeText(fusion.synthesized)}
          >
            复制
          </button>
        </div>
      )}
    </div>
  );
}
