"use client";

import { useCallback, useRef } from "react";
import { useChatStore } from "@/stores/chat-store";

export function useChat() {
  const store = useChatStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  const sendChat = useCallback(
    async (prompt: string, models: string[]) => {
      if (!prompt.trim() || models.length === 0) return;

      store.reset();
      store.setStatus("streaming");

      models.forEach((model) => {
        store.appendChunk(model, "");
      });

      try {
        // 读取用户设置的 API Key
        const apiKeys: Record<string, string> = {};
        const KEY_MAP: Record<string, string> = {
          deepseek: "DEEPSEEK_API_KEY",
          qwen: "QWEN_API_KEY",
          claude: "ANTHROPIC_API_KEY",
          gemini: "GEMINI_API_KEY",
        };
        models.forEach((m) => {
          const envKey = KEY_MAP[m];
          if (envKey) {
            const stored = localStorage.getItem(`arenaqa-${envKey}`);
            if (stored) apiKeys[m] = stored;
          }
        });

        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, models, apiKeys }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const { taskId } = await res.json();
        store.setTaskId(taskId);

        const eventSource = new EventSource(`/api/chat/stream/${taskId}`);
        eventSourceRef.current = eventSource;

        eventSource.addEventListener("connected", () => {
          // SSE 连接确认
        });

        eventSource.addEventListener("chunk", (e: Event) => {
          const me = e as MessageEvent;
          const data = JSON.parse(me.data);
          store.appendChunk(data.model, data.content);
        });

        eventSource.addEventListener("done", (e: Event) => {
          const me = e as MessageEvent;
          const data = JSON.parse(me.data);
          store.setAnswerDone(data.model, data.latencyMs);
        });

        eventSource.addEventListener("error", (e: Event) => {
          try {
            const me = e as MessageEvent;
            const data = JSON.parse(me.data);
            store.setAnswerError(data.model, data.error);
          } catch {
            // 非 JSON error 事件，忽略
          }
        });

        eventSource.addEventListener("judge", (e: Event) => {
          const me = e as MessageEvent;
          const data = JSON.parse(me.data);
          store.setScores(data.scores);
          store.setStatus("judging");
        });

        eventSource.addEventListener("fusion", (e: Event) => {
          const me = e as MessageEvent;
          const data = JSON.parse(me.data);
          store.setFusion(data);
          store.setStatus("fusing");
        });

        eventSource.addEventListener("complete", () => {
          store.setStatus("complete");
          eventSource.close();
          eventSourceRef.current = null;
        });

        eventSource.addEventListener("judge_error", (e: Event) => {
          try {
            const me = e as MessageEvent;
            JSON.parse(me.data);
          } catch {
            // ignore
          }
          store.setStatus("complete");
        });

        eventSource.onerror = () => {
          eventSource.close();
          eventSourceRef.current = null;
        };
      } catch (err) {
        store.setStatus("idle");
      }
    },
    [store]
  );

  const abortChat = useCallback(async () => {
    const { taskId } = store;
    if (!taskId) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      await fetch(`/api/chat/abort/${taskId}`, { method: "POST" });
    } catch {
      // 中止请求失败也不影响状态
    }

    store.setStatus("idle");
  }, [store]);

  return { sendChat, abortChat };
}
