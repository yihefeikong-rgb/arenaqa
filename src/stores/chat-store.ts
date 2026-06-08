import { create } from "zustand";
import type { ChatState } from "@/types";

export const useChatStore = create<ChatState>((set, get) => ({
  status: "idle",
  selectedModels: [],
  answers: {},
  scores: [],
  fusion: null,
  taskId: null,

  selectModel: (model) => {
    set((state) => {
      if (state.selectedModels.length >= 4) return state;
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

  reset: () =>
    set({
      status: "idle",
      answers: {},
      scores: [],
      fusion: null,
      taskId: null,
    }),
}));
