"use client";

import { useCallback, useRef } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useStreamBuffer } from "./useStreamBuffer";
import { BUILTIN_MODELS, getLocalStorageKey } from "@/lib/model-registry";

export function useChat() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const { addChunk, flushAll, reset: resetBuffer } = useStreamBuffer();

  const sendChat = useCallback(
    async (prompt: string, models: string[]) => {
      if (!prompt.trim() || models.length === 0) return;

      const st = useChatStore.getState();
      st.reset();
      resetBuffer();
      useChatStore.setState({ lastPrompt: prompt });
      st.setStatus("streaming");

      models.forEach((model) => {
        st.appendChunk(model, "");
      });

      try {
        // 读取用户设置的 API Key（从统一配置中心）
        const apiKeys: Record<string, string> = {};
        models.forEach((m) => {
          const def = BUILTIN_MODELS.find((d) => d.id === m);
          if (def) {
            const stored = localStorage.getItem(getLocalStorageKey(def.storagePrefix, 'API_KEY'));
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
        } catch { console.warn('[useChat] custom models JSON parse failed'); }

        // NVIDIA NIM — 按模型 ID 映射（从 NIM API 查询验证）
        const nimKey = localStorage.getItem("arenaqa-NIM_API_KEY");
        const NIM_MODEL_MAP: Record<string, string> = {
          "nim-deepseek-v4-flash": "deepseek-ai/deepseek-v4-flash",
          "nim-deepseek-v4-pro": "deepseek-ai/deepseek-v4-pro",
          "nim-qwen3-next": "qwen/qwen3-next-80b-a3b-instruct",
          "nim-step-3.5-flash": "stepfun-ai/step-3.5-flash",
          "nim-step-3.7-flash": "stepfun-ai/step-3.7-flash",
          "nim-gemma-4": "google/gemma-4-31b-it",
          "nim-llama-3.1-8b": "meta/llama-3.1-8b-instruct",
          "nim-llama-4": "meta/llama-4-maverick-17b-128e-instruct",
          "nim-llama-3.3-70b": "meta/llama-3.3-70b-instruct",
          "nim-mistral-large3": "mistralai/mistral-large-3-675b-instruct-2512",
          "nim-mistral-nemotron": "mistralai/mistral-nemotron-instruct",
          "nim-minimax-m2.7": "minimaxai/minimax-m2.7",
          "nim-nemotron-mini": "nvidia/nemotron-mini-4b-instruct",
          "nim-phi-4-mini": "microsoft/phi-4-mini-instruct",
          "nim-mistral-small-4": "mistralai/mistral-small-4-119b-2603",
          "nim-qwen3-coder-480b": "qwen/qwen3-coder-480b-a35b-instruct",
          "nim-nemotron-ultra-253b": "nvidia/llama-3.1-nemotron-ultra-253b-v1",
          "nim-mistral-medium-3.5": "mistralai/mistral-medium-3.5-128b",
          "nim-qwen3.5-122b": "qwen/qwen3.5-122b-a10b",
          "nim-yi-large": "01-ai/yi-large",
          "nim-glm-5.1": "z-ai/glm-5.1",
          "nim-kimi-k2.6": "moonshotai/kimi-k2.6",
        };
        models.forEach((m) => {
          const realModelId = NIM_MODEL_MAP[m];
          if (realModelId) {
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
        } catch { console.warn('[useChat] custom models JSON parse failed (line 94)'); }
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

        // 内置模型的 Base URL + Model ID（用户自定义覆盖，从统一配置中心读取）
        const modelConfigs = models.map((m) => {
          const def = BUILTIN_MODELS.find((d) => d.id === m);
          if (!def) return { model: m };
          return {
            model: m,
            apiBase: localStorage.getItem(getLocalStorageKey(def.storagePrefix, 'BASE_URL')) || undefined,
            modelId: localStorage.getItem(getLocalStorageKey(def.storagePrefix, 'MODEL_ID')) || undefined,
          };
        });

        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, models, apiKeys: { ...apiKeys, ...CUSTOM_KEYS }, modelConfigs, customModels, judgeConfig }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const { taskId } = await res.json();
        useChatStore.getState().setTaskId(taskId);

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
            useChatStore.getState().appendChunk(model, text);
          });
        });

        eventSource.addEventListener("done", (e: Event) => {
          const me = e as MessageEvent;
          const data = JSON.parse(me.data);
          flushAll((model, text) => {
            useChatStore.getState().appendChunk(model, text);
          });
          useChatStore.getState().setAnswerDone(data.model, data.latencyMs);
        });

        eventSource.addEventListener("error", (e: Event) => {
          try {
            const me = e as MessageEvent;
            const data = JSON.parse(me.data);
            useChatStore.getState().setAnswerError(data.model, data.error);
          } catch {
            // 非 JSON error 事件，可能为 EventSource 内部状态事件
            console.warn('[useChat] SSE error parse failed (may be internal)');
          }
        });

        eventSource.addEventListener("judge", (e: Event) => {
          const me = e as MessageEvent;
          const data = JSON.parse(me.data);
          useChatStore.setState({ scores: data.scores, status: "judging" as const });
        });

        eventSource.addEventListener("fusion", (e: Event) => {
          const me = e as MessageEvent;
          const data = JSON.parse(me.data);
          useChatStore.setState({ fusion: data, status: "fusing" as const });
        });

        eventSource.addEventListener("complete", () => {
          flushAll((model, text) => {
            useChatStore.getState().appendChunk(model, text);
          });
          useChatStore.getState().setStatus("complete");

          // 自动保存历史记录
          const state = useChatStore.getState();
          const answers = Object.entries(state.answers).map(([model, a]) => ({
            model,
            content: a.content,
            latencyMs: a.latencyMs,
            error: a.error,
          }));
          fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: state.lastPrompt,
              answers,
              scores: state.scores,
              fusion: state.fusion,
            }),
          }).catch((e) => { console.warn('[useChat] history save failed', e); });

          eventSource.close();
          eventSourceRef.current = null;
        });

        eventSource.addEventListener("judge_error", (e: Event) => {
          try {
            const me = e as MessageEvent;
            JSON.parse(me.data);
          } catch {
            console.warn('[useChat] judge_error JSON parse failed');
          }
          useChatStore.getState().setStatus("complete");
        });

        eventSource.onerror = () => {
          // 不关闭连接 — 让浏览器自动重连
          // 关闭会导致后续事件丢失
        };
      } catch (err) {
        console.warn('[useChat] sendChat failed', err);
        useChatStore.getState().setStatus("idle");
      }
    },
    [addChunk, flushAll, resetBuffer]
  );

  const abortChat = useCallback(async () => {
    const { taskId } = useChatStore.getState();
    if (!taskId) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.onerror = null;
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    resetBuffer();

    try {
      await fetch(`/api/chat/abort/${taskId}`, { method: "POST" });
    } catch (e) {
      console.warn('[useChat] abort fetch failed', e);
    }

    useChatStore.getState().setStatus("idle");
  }, [resetBuffer]);

  const stopModel = useCallback(
    async (model: string) => {
      useChatStore.getState().stopModel(model);
      const { taskId } = useChatStore.getState();
      if (taskId) {
        try {
          await fetch(`/api/chat/stop/${taskId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model }),
          });
        } catch (e) { console.warn('[useChat] stop model fetch failed', e); }
      }
    },
    []
  );

  const retryModel = useCallback(
    async (model: string) => {
      const { lastPrompt } = useChatStore.getState();
      if (!lastPrompt) return;

      const st = useChatStore.getState();
      st.setAnswerDone(model, 0);
      st.appendChunk(model, "");

      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: lastPrompt, models: [model] }),
      });

      if (!res.ok) {
        st.setAnswerError(model, `请求失败 (${res.status})`);
        return;
      }

      const { taskId } = await res.json();
      const retryEs = new EventSource(`/api/chat/stream/${taskId}`);

      retryEs.addEventListener("chunk", (e: Event) => {
        const me = e as MessageEvent;
        const data = JSON.parse(me.data);
        addChunk(data.model, data.content, (m, text) => {
          useChatStore.getState().appendChunk(m, text);
        });
      });

      retryEs.addEventListener("done", (e: Event) => {
        const me = e as MessageEvent;
        const data = JSON.parse(me.data);
        flushAll((m, text) => useChatStore.getState().appendChunk(m, text));
        useChatStore.getState().setAnswerDone(data.model, data.latencyMs);
        retryEs.close();
      });

      retryEs.addEventListener("error", (e: Event) => {
        try {
          const me = e as MessageEvent;
          const data = JSON.parse(me.data);
          useChatStore.getState().setAnswerError(data.model, data.error);
          retryEs.close();
        } catch {
          console.warn('[useChat] retry error parse failed');
        }
      });

      retryEs.onerror = () => {
        retryEs.close();
      };
    },
    [addChunk, flushAll]
  );

  return { sendChat, abortChat, stopModel, retryModel };
}
