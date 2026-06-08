// ============================================================
// Zustand Store — 聊天状态管理（状态机）
// ============================================================

import { create } from 'zustand';
import type { ChatState, AnswerState, JudgeEvent, FusionEvent, ChatStatus } from '@/types';

interface ChatStore extends ChatState {
  setPrompt: (prompt: string) => void;
  sendChat: (prompt: string, models: string[]) => Promise<void>;
  appendChunk: (model: string, content: string) => void;
  markDone: (model: string, latencyMs: number) => void;
  markError: (model: string, error: string) => void;
  setJudgeResult: (result: JudgeEvent) => void;
  setFusionResult: (result: FusionEvent) => void;
  setComplete: () => void;
  reset: () => void;
}

const initialState: ChatState = {
  status: 'idle',
  prompt: '',
  answers: {},
};

export const useChatStore = create<ChatStore>((set, get) => ({
  ...initialState,

  setPrompt: (prompt) => set({ prompt }),

  sendChat: async (prompt, models) => {
    set({
      status: 'streaming',
      prompt,
      answers: Object.fromEntries(
        models.map((m) => [m, { model: m, content: '', status: 'streaming' }])
      ),
      judgeResult: undefined,
      fusionResult: undefined,
    });

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, models }),
      });

      if (!res.ok) {
        throw new Error((await res.json()).detail);
      }

      const { taskId } = await res.json();
      set({ taskId });

      // 连接 SSE
      const eventSource = new EventSource(`/api/chat/stream/${taskId}`);

      eventSource.addEventListener('chunk', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        get().appendChunk(data.model, data.content);
      });

      eventSource.addEventListener('done', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        get().markDone(data.model, data.latencyMs);
      });

      eventSource.addEventListener('error', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          get().markError(data.model, data.error);
        } catch {
          // 非 JSON 错误事件忽略
        }
      });

      eventSource.addEventListener('judge', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        get().setJudgeResult(data);
      });

      eventSource.addEventListener('fusion', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        get().setFusionResult(data);
      });

      eventSource.addEventListener('complete', () => {
        get().setComplete();
        eventSource.close();
      });

      eventSource.onerror = () => {
        eventSource.close();
      };
    } catch (err) {
      set({
        status: 'complete',
        answers: Object.fromEntries(
          models.map((m) => [
            m,
            {
              model: m,
              content: '',
              status: 'error',
              error: err instanceof Error ? err.message : 'Connection failed',
            },
          ])
        ),
      });
    }
  },

  appendChunk: (model, content) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [model]: {
          ...state.answers[model],
          content: (state.answers[model]?.content ?? '') + content,
        },
      },
    })),

  markDone: (model, latencyMs) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [model]: {
          ...state.answers[model],
          status: 'done',
          latencyMs,
        },
      },
    })),

  markError: (model, error) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [model]: {
          ...state.answers[model],
          status: 'error',
          error,
        },
      },
    })),

  setJudgeResult: (result) => set({ judgeResult: result, status: 'judging' }),

  setFusionResult: (result) => set({ fusionResult: result, status: 'fusing' }),

  setComplete: () => set({ status: 'complete' }),

  reset: () => set({ ...initialState }),
}));
