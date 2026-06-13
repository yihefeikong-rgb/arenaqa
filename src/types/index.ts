// ============================================================
// ArenaQA — 核心类型定义
// ============================================================

// --- 模型配置（后端） ---

export interface ModelConfig {
  name: string;
  displayName: string;
  providerType: "openai_compat" | "anthropic" | "google" | "playwright";
  modelId: string;
  apiBase?: string;
  enabled: boolean;
  description: string;
}

// --- 多轮对话消息 ---

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// --- 问答请求/响应（后端 API） ---

export interface CustomModelConfig {
  id: string;
  name: string;
  apiBase: string;
  modelId: string;
}

export interface JudgeConfig {
  apiKey: string;
  baseUrl: string;
  modelId: string;
}

export interface ModelRuntimeConfig {
  model: string;
  apiBase?: string;
  modelId?: string;
}

export interface ChatRequest {
  prompt: string;
  models: string[];
  apiKeys?: Record<string, string>;
  modelConfigs?: ModelRuntimeConfig[];
  customModels?: CustomModelConfig[];
  judgeConfig?: JudgeConfig | null;
  conversationId?: string;  // 继续对话时传入
  round?: number;            // 当前请求是第几轮
}

// --- 历史 API 响应（按轮分组） ---

export interface RoundGroup {
  round: number;
  prompt: string;
  answers: Array<{
    model: string;
    content: string;
    status: string;
    latencyMs?: number;
    error?: string;
  }>;
  scores?: Score[];
  fusion?: FusionResult | null;
}

export interface ConversationDetail {
  id: string;
  prompt: string;
  title?: string;
  roundCount: number;
  createdAt: string;
  rounds: RoundGroup[];
}

export interface TaskCreated {
  taskId: string;
  models: string[];
  createdAt: string;
}

// --- SSE 事件类型（后端 → 前端） ---

export interface ChunkEvent {
  model: string;
  content: string;
  index: number;
}

export interface DoneEvent {
  model: string;
  latencyMs: number;
  totalChars: number;
}

export interface ErrorEvent {
  model: string;
  error: string;
  code: "TIMEOUT" | "PROVIDER_ERROR" | "RATE_LIMITED";
}

export interface Score {
  model: string;
  accuracy: number;
  completeness: number;
  actionability: number;
  safety: number;
  total: number;
  brief: string;
}

export interface JudgeEvent {
  scores: Score[];
}

export interface Divergence {
  topic: string;
  positions: Record<string, string>;
}

export interface FusionResult {
  consensus: string[];
  divergences: Divergence[];
  synthesized: string;
}

export interface FusionEvent {
  consensus: string[];
  divergences: Divergence[];
  synthesized: string;
}

export interface CompleteEvent {
  taskId: string;
  totalLatencyMs: number;
  allFailed?: boolean;
}

export type SSEEvent =
  | { type: "chunk"; data: ChunkEvent }
  | { type: "done"; data: DoneEvent }
  | { type: "error"; data: ErrorEvent }
  | { type: "judge"; data: JudgeEvent }
  | { type: "judge_error"; data: { error: string } }
  | { type: "fusion"; data: FusionEvent }
  | { type: "complete"; data: CompleteEvent };

// --- 前端状态类型 ---

export interface AnswerState {
  model: string;
  content: string;
  status: "streaming" | "done" | "error" | "stopped";
  latencyMs?: number;
  error?: string;
}

export type ChatStatus = "idle" | "streaming" | "judging" | "fusing" | "complete";

export interface ChatState {
  status: ChatStatus;
  selectedModels: string[];
  answers: Record<string, AnswerState>;
  scores: Score[];
  fusion: FusionResult | null;
  taskId: string | null;
  lastPrompt: string;
  currentHistoryId: string | null;
  // 多轮支持
  conversationId: string | null;
  messages: ChatMessage[];
  currentRound: number;
  selectModel: (model: string) => void;
  deselectModel: (model: string) => void;
  setStatus: (status: ChatStatus) => void;
  appendChunk: (model: string, content: string) => void;
  setAnswerDone: (model: string, latencyMs: number) => void;
  setAnswerError: (model: string, error: string) => void;
  setScores: (scores: Score[]) => void;
  setFusion: (fusion: FusionResult) => void;
  setTaskId: (taskId: string) => void;
  stopModel: (model: string) => void;
  addUserMessage: (content: string) => void;
  setConversation: (id: string, round: number) => void;
  reset: () => void;
  newChat: () => void;
}

// --- 运行时配置 ---

export interface RuntimeConfig {
  judgeModel: string;
  judgeProvider: string;
  singleModelTimeoutS: number;
  maxPromptLength: number;
  modelsCount: number;
}
