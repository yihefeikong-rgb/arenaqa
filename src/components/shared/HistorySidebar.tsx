"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useChatStore } from "@/stores/chat-store";
import { HistoryList } from "./HistoryList";

interface HistoryItem {
  id: string;
  prompt: string;
  modelCount: number;
  createdAt: string;
}

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function HistorySidebar({ collapsed, onToggle }: Props) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const loadDetailSeq = useRef(0);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/history?limit=50");
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.warn('[HistorySidebar] fetchList failed', e);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const loadDetail = useCallback(async (id: string) => {
    loadDetailSeq.current += 1;
    const seq = loadDetailSeq.current;
    try {
      const res = await fetch(`/api/history/${id}`);
      if (!res.ok) return;
      if (seq !== loadDetailSeq.current) return;
      const data = await res.json();

      const answers: Record<string, { model: string; content: string; status: "done" | "error"; latencyMs?: number; error?: string }> = {};
      data.answers?.forEach((a: { model: string; content: string; status: string; latencyMs?: number; error?: string }) => {
        answers[a.model] = {
          model: a.model,
          content: a.content,
          status: a.status === "error" ? "error" : "done",
          latencyMs: a.latencyMs,
          error: a.error,
        };
      });

      useChatStore.setState({
        answers,
        scores: data.scores || [],
        fusion: data.fusion || null,
        lastPrompt: data.prompt,
        status: "complete",
        currentHistoryId: id,
      });
    } catch (e) {
      console.warn('[HistorySidebar] loadDetail failed', e);
    }
  }, []);

  if (collapsed) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-3 shrink-0">
        <button onClick={onToggle} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500" title="展开历史">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <div className="w-6 h-px bg-gray-200" />
        {items.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => loadDetail(item.id)}
            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-gray-500 hover:text-indigo-600 transition-colors"
            title={item.prompt.slice(0, 30)}
          >
            {item.modelCount}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-[260px] bg-white border-r border-gray-200 flex flex-col shrink-0 h-full">
      <div className="px-3 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">历史记录</h3>
        <button onClick={onToggle} className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400" title="折叠">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
      <HistoryList />
    </div>
  );
}
