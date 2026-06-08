"use client";

import { useEffect, useRef } from "react";
import type { Score } from "@/types";

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

const DIM_CONFIG = [
  { key: "accuracy" as const, label: "准确性", color: "#3B82F6" },
  { key: "completeness" as const, label: "完整性", color: "#10B981" },
  { key: "actionability" as const, label: "可操作性", color: "#F59E0B" },
  { key: "safety" as const, label: "安全性", color: "#EF4444" },
];

interface Props {
  score: Score;
  index: number;
}

export function ScoreCard({ score, index }: Props) {
  const meta = MODEL_META[score.model];
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      barRefs.current.forEach((bar, i) => {
        if (bar) bar.style.width = `${score[DIM_CONFIG[i].key] * 10}%`;
      });
    }, 100 + index * 150);
    return () => clearTimeout(timer);
  }, [score, index]);

  const gradient = MODEL_GRADIENT[score.model] || "from-gray-500 to-gray-600";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-3 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 font-semibold text-sm text-gray-900 dark:text-gray-100">
          <div className={`w-6 h-6 rounded bg-gradient-to-br ${gradient} flex items-center justify-center text-[10px] text-white font-bold shrink-0`}>
            {meta?.icon || "?"}
          </div>
          <span>{meta?.name || score.model}</span>
        </div>
        <div className="text-xl font-bold text-indigo-500 dark:text-indigo-400">
          {score.total}<span className="text-xs text-gray-400 font-medium"> /10</span>
        </div>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">{score.brief}</div>
      <div className="space-y-1.5">
        {DIM_CONFIG.map((dim, i) => (
          <div key={dim.key} className="flex items-center gap-2">
            <div className="w-14 text-[11px] text-gray-500 dark:text-gray-400 text-right shrink-0">{dim.label}</div>
            <div className="flex-1 h-[5px] bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                ref={(el) => { barRefs.current[i] = el; }}
                className="h-full rounded-full transition-all"
                style={{ width: "0%", backgroundColor: dim.color, transitionDuration: "700ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
              />
            </div>
            <div className="w-6 text-[11px] text-gray-500 dark:text-gray-400 text-right tabular-nums">{score[dim.key]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
