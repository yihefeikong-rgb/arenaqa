"use client";

import { useState, useEffect, useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";

interface HistoryItem {
  id: string;
  prompt: string;
  modelCount: number;
  createdAt: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function groupByDate(items: HistoryItem[]): Map<string, HistoryItem[]> {
  const groups = new Map<string, HistoryItem[]>();
  items.forEach((item) => {
    const key = formatDate(item.createdAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  });
  return groups;
}

export function HistoryList() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");

  const fetchList = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history?limit=50&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const loadDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`);
      if (!res.ok) return;
      const data = await res.json();

      const store = useChatStore.getState();
      store.reset();
      store.setStatus("complete");

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
      });
    } catch {
      // ignore
    }
  }, []);

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/history/${id}`, { method: "DELETE" });
        setItems((prev) => prev.filter((i) => i.id !== id));
      } catch {
        // ignore
      }
    },
    []
  );

  const renameItem = useCallback(async (id: string, newPrompt: string) => {
    if (!newPrompt.trim()) return;
    try {
      await fetch(`/api/history/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: newPrompt.trim() }),
      });
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, prompt: newPrompt.trim() } : i))
      );
    } catch {
      // ignore
    }
    setRenamingId(null);
  }, []);

  const clearAll = useCallback(async () => {
    if (!confirm("确认清空所有历史记录？")) return;
    try {
      await fetch("/api/history", { method: "DELETE" });
      setItems([]);
    } catch {
      // ignore
    }
  }, []);

  const filtered = search
    ? items.filter((i) => i.prompt.toLowerCase().includes(search.toLowerCase()))
    : items;
  const searchGroups = groupByDate(search ? filtered : items);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 py-2 shrink-0">
        <input
          className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20"
          placeholder="搜索历史..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-xs text-gray-400 dark:text-gray-500">加载中...</div>
        ) : searchGroups.size === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-2 opacity-40">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div className="text-xs">暂无历史记录</div>
          </div>
        ) : (
          Array.from(searchGroups.entries()).map(([dateLabel, dateItems]) => (
            <div key={dateLabel} className="mb-3">
              <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium px-1.5 mb-1">{dateLabel}</div>
              {dateItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-start gap-1.5 px-1.5 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {renamingId === item.id ? (
                    <input
                      className="flex-1 px-1.5 py-0.5 text-xs border border-indigo-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      value={renameText}
                      onChange={(e) => setRenameText(e.target.value)}
                      onBlur={() => renameItem(item.id, renameText)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameItem(item.id, renameText);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => loadDetail(item.id)}
                    >
                      <div className="text-xs text-gray-800 dark:text-gray-200 truncate">{item.prompt.slice(0, 40)}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {item.modelCount} 模型 · {new Date(item.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  )}
                  {renamingId !== item.id && (
                    <>
                      <button
                        className="opacity-60 md:opacity-0 md:group-hover:opacity-100 w-5 h-5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 shrink-0 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(item.id);
                          setRenameText(item.prompt);
                        }}
                        title="重命名"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="opacity-60 md:opacity-0 md:group-hover:opacity-100 w-5 h-5 rounded hover:bg-red-50 flex items-center justify-center text-red-400 shrink-0 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                        title="删除"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={clearAll}
            className="w-full py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            清空全部
          </button>
        </div>
      )}
    </div>
  );
}
