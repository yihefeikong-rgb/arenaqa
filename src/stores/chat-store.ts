import { create } from "zustand";
import type { ChatState } from "@/types";

export const useChatStore = create<ChatState>((set) => ({
  status: "idle",
  selectedModels: [],
  answers: {},
  scores: [],
  fusion: null,
  taskId: null,
  lastPrompt: "",
  currentHistoryId: null,
  conversationId: null,
  messages: [],
  currentRound: 1,
  rounds: [],
  selectedRound: 1,

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
          conversationId: null,
          messages: [],
          currentRound: 1,
          rounds: [],
          selectedRound: 1,
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

  addUserMessage: (content) =>
    set((state) => ({
      messages: [...state.messages, { role: "user", content }],
      lastPrompt: content,
    })),

  setConversation: (id, round) =>
    set({ conversationId: id, currentRound: round }),

  setRounds: (rounds) =>
    set({ rounds }),

  selectRound: (round) =>
    set((state) => {
      const rd = state.rounds.find((r) => r.round === round);
      if (!rd) return { selectedRound: round };
      return {
        selectedRound: round,
        answers: Object.fromEntries(
          rd.answers.map((a) => [a.model, {
            model: a.model,
            content: a.content,
            status: a.status as "done" | "error" | "streaming",
            latencyMs: a.latencyMs,
            error: a.error,
          }])
        ),
        scores: rd.scores ?? [],
        fusion: rd.fusion ?? null,
        lastPrompt: rd.prompt,
      };
    }),

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
      conversationId: null,
      messages: [],
      currentRound: 1,
      rounds: [],
      selectedRound: 1,
    }),
}));
