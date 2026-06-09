"use client";

import { useCallback, useRef } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useStreamBuffer } from "./useStreamBuffer";

export function useChat() {
  const store = useChatStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const { addChunk, flushAll, reset: resetBuffer } = useStreamBuffer();

  const sendChat = useCallback(
    async (prompt: string, models: string[]) => {
      if (!prompt.trim() || models.length === 0) return;

      store.reset();
      resetBuffer();
      useChatStore.setState({ lastPrompt: prompt });
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

        // 自定义模型
        let customModels: Array<{ id: string; name: string; apiBase: string; modelId: string }> = [];
        try {
          const raw = localStorage.getItem("arenaqa-custom-models");
          if (raw) {
            customModels = JSON.parse(raw).map((m: { id: string; name: string; apiBase: string; apiKey: string; modelId: string }) => ({
              id: m.id, name: m.name, apiBase: m.apiBase, modelId: m.modelId,
            }));
          }
        } catch { /* ignore */ }

        // NVIDIA NIM — 按模型 ID 映射
        const nimKey = localStorage.getItem("arenaqa-NIM_API_KEY");
        const NIM_MODEL_MAP: Record<string, string> = {
          "nim-deepseek-v4-flash": "deepseek-ai/deepseek-v4-flash",
          "nim-deepseek-v4-pro": "deepseek-ai/deepseek-v4-pro",
          "nim-qwen3-next": "qwen/qwen3-next-80b-a3b-instruct",
          "nim-qwen3.5-122b": "qwen/qwen3.5-122b-a10b",
          "nim-step-3.5-flash": "stepfun-ai/step-3.5-flash",
          "nim-gemma-4": "google/gemma-4-31b-it",
          "nim-llama-3.1-8b": "meta/llama-3.1-8b-instruct",
          "nim-kimi-k2.6": "moonshotai/kimi-k2.6",
          "nim-glm-5.1": "z-ai/glm-5.1",
          "nim-minimax-m2.7": "minimaxai/minimax-m2.7",
          "nim-yi-large": "01-ai/yi-large",
          "nim-llama-4": "meta/llama-4-maverick-17b-128e-instruct",
          "nim-llama-3.3-70b": "meta/llama-3.3-70b-instruct",
          "nim-mistral-large3": "mistralai/mistral-large-3-675b-instruct-2512",
        };
        models.forEach((m) => {
          const realModelId = NIM_MODEL_MAP[m];
          if (realModelId && nimKey) {
            customModels.push({
              id: m,
              name: "NVIDIA NIM",
              apiBase: "https://integrate.api.nvidia.com/v1",
              modelId: realModelId,
            });
          }
        });

        // 自定义模型的 Key
        const CUSTOM_KEYS: Record<string, string> = {};
        try {
          const raw = localStorage.getItem("arenaqa-custom-models");
          if (raw) {
            JSON.parse(raw).forEach((m: { id: string; apiKey: string }) => {
              if (m.apiKey) CUSTOM_KEYS[m.id] = m.apiKey;
            });
          }
        } catch { /* ignore */ }
        if (nimKey) {
          models.forEach((m) => {
            if (m.startsWith("nim-")) CUSTOM_KEYS[m] = nimKey;
          });
        }

        // 裁判模型配置
        const judgeKey = localStorage.getItem("arenaqa-JUDGE_API_KEY");
        const judgeBase = localStorage.getItem("arenaqa-JUDGE_BASE_URL");
        const judgeModel = localStorage.getItem("arenaqa-JUDGE_MODEL");
        const judgeConfig = (judgeKey && judgeBase && judgeModel)
          ? { apiKey: judgeKey, baseUrl: judgeBase, modelId: judgeModel }
          : null;

        // 内置模型的 Base URL + Model ID（用户自定义覆盖）
        const MODEL_STORAGE_PREFIX: Record<string, string> = {
          deepseek: "DEEPSEEK", qwen: "QWEN", claude: "ANTHROPIC", gemini: "GEMINI",
        };
        const modelConfigs = models.map((m) => {
          const prefix = MODEL_STORAGE_PREFIX[m];
          if (!prefix) return { model: m };
          return {
            model: m,
            apiBase: localStorage.getItem(`arenaqa-${prefix}_BASE_URL`) || undefined,
            modelId: localStorage.getItem(`arenaqa-${prefix}_MODEL_ID`) || undefined,
          };
        });

        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, models, apiKeys: { ...apiKeys, ...CUSTOM_KEYS }, modelConfigs, customModels, judgeConfig }),
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
          const currentAnswers = useChatStore.getState().answers;
          if (currentAnswers[data.model]?.status === "stopped") return;
          addChunk(data.model, data.content, (model, text) => {
            store.appendChunk(model, text);
          });
        });

        eventSource.addEventListener("done", (e: Event) => {
          const me = e as MessageEvent;
          const data = JSON.parse(me.data);
          flushAll((model, text) => {
            store.appendChunk(model, text);
          });
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
          flushAll((model, text) => {
            store.appendChunk(model, text);
          });
          store.setStatus("complete");

          // 自动保存历史记录
          const state = useChatStore.getState();
          fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: state.lastPrompt,
              answers: Object.values(state.answers),
              scores: state.scores,
              fusion: state.fusion,
            }),
          }).catch(() => {});

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
          // 不关闭连接 — 让浏览器自动重连
          // 关闭会导致后续事件丢失
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
      eventSourceRef.current.onerror = null;
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    resetBuffer();

    try {
      await fetch(`/api/chat/abort/${taskId}`, { method: "POST" });
    } catch {
      // ignore
    }

    store.setStatus("idle");
  }, [store]);

  const stopModel = useCallback(
    (model: string) => {
      store.stopModel(model);
    },
    [store]
  );

  const retryModel = useCallback(
    async (model: string) => {
      const { lastPrompt } = useChatStore.getState();
      if (!lastPrompt) return;

      store.setAnswerDone(model, 0);
      store.appendChunk(model, "");

      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: lastPrompt, models: [model] }),
      });

      if (!res.ok) {
        store.setAnswerError(model, `请求失败 (${res.status})`);
        return;
      }

      const { taskId } = await res.json();
      const retryEs = new EventSource(`/api/chat/stream/${taskId}`);

      retryEs.addEventListener("chunk", (e: Event) => {
        const me = e as MessageEvent;
        const data = JSON.parse(me.data);
        addChunk(data.model, data.content, (m, text) => {
          store.appendChunk(m, text);
        });
      });

      retryEs.addEventListener("done", (e: Event) => {
        const me = e as MessageEvent;
        const data = JSON.parse(me.data);
        flushAll((m, text) => store.appendChunk(m, text));
        store.setAnswerDone(data.model, data.latencyMs);
        retryEs.close();
      });

      retryEs.addEventListener("error", (e: Event) => {
        try {
          const me = e as MessageEvent;
          const data = JSON.parse(me.data);
          store.setAnswerError(data.model, data.error);
          retryEs.close();
        } catch {
          // ignore
        }
      });

      retryEs.onerror = () => {
        retryEs.close();
      };
    },
    [store, addChunk, flushAll]
  );

  return { sendChat, abortChat, stopModel, retryModel };
}
