import { create } from "zustand";
import type { ChatState } from "@/types";

export const useChatStore = create<ChatState>((set, get) => ({
  status: "idle",
  selectedModels: [],
  answers: {},
  scores: [],
  fusion: null,
  taskId: null,
  lastPrompt: "",
  currentHistoryId: null,

  selectModel: (model) => {
    set((state) => {
      // 如果在查看历史（有 answers 且是加载来的），选模型=开始新对话
      if (state.currentHistoryId && Object.keys(state.answers).length > 0) {
        return {
          status: "idle" as const,
          selectedModels: [model],
          answers: {},
          scores: [],
          fusion: null,
          taskId: null,
          lastPrompt: "",
          currentHistoryId: null,
        };
      }
      if (state.selectedModels.length >= 6) return state;
      if (state.selectedModels.includes(model)) return state;
      return { selectedModels: [...state.selectedModels, model] };
    });
  },

  deselectModel: (model) => {
    set((state) => ({
      selectedModels: state.selectedModels.filter((m) => m !== model),
    }));
  },

  setStatus: (status) => set({ status }),

  appendChunk: (model, content) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [model]: {
          ...state.answers[model],
          content: (state.answers[model]?.content || "") + content,
        },
      },
    })),

  setAnswerDone: (model, latencyMs) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [model]: {
          ...(state.answers[model] || { model, content: "", status: "streaming" }),
          status: "done",
          latencyMs,
        },
      },
    })),

  setAnswerError: (model, error) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [model]: {
          ...(state.answers[model] || { model, content: "", status: "streaming" }),
          status: "error",
          error,
        },
      },
    })),

  setScores: (scores) => set({ scores }),

  setFusion: (fusion) => set({ fusion }),

  setTaskId: (taskId) => set({ taskId }),

  stopModel: (model) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [model]: {
          ...(state.answers[model] || { model, content: "", status: "streaming" }),
          status: "stopped",
        },
      },
    })),

  reset: () =>
    set({
      status: "idle",
      answers: {},
      scores: [],
      fusion: null,
      taskId: null,
      currentHistoryId: null,
    }),

  newChat: () =>
    set({
      status: "idle",
      selectedModels: [],
      answers: {},
      scores: [],
      fusion: null,
      taskId: null,
      lastPrompt: "",
      currentHistoryId: null,
    }),
}));
