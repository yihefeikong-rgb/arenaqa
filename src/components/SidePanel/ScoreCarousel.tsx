"use client";

import { useState } from "react";
import type { Score } from "@/types";
import { ScoreCard } from "./ScoreCard";

interface Props {
  scores: Score[];
}

export function ScoreCarousel({ scores }: Props) {
  const total = scores.length;
  const itemsPerPage = 3;
  const totalPages = Math.ceil(total / itemsPerPage);
  const [page, setPage] = useState(0);

  if (total === 0) return null;

  const startIdx = page * itemsPerPage;
  const pageScores = scores.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="flex flex-col h-full">
      {/* 卡片主体 — 两列 */}
      <div className="flex-1 min-h-0 flex flex-col gap-0">
        {pageScores.map((score, i) => (
          <ScoreCard key={score.model} score={score} index={startIdx + i} />
        ))}
      </div>

      {/* 分页导航 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100 dark:border-gray-700/50">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← 上一页
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === page
                    ? "bg-indigo-500 w-4"
                    : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            下一页 →
          </button>
        </div>
      )}

      {/* 模型标签条 */}
      <div className="flex flex-wrap gap-1 mt-2">
        {scores.map((s, i) => {
          const p = Math.floor(i / itemsPerPage);
          return (
            <button
              key={s.model}
              onClick={() => setPage(p)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                Math.floor(i / itemsPerPage) === page
                  ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400"
                  : "border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {s.model.replace(/^nim-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          );
        })}
      </div>
    </div>
  );
}
