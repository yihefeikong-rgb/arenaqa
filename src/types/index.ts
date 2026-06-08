// ============================================================
// ArenaQA — 核心类型定义
// ============================================================

// --- 模型配置 ---

export interface ModelConfig {
  name: string;
  displayName: string;
  providerType: 'openai_compat' | 'anthropic' | 'google' | 'playwright';
  modelId: string;
  apiBase?: string;
  enabled: boolean;
  description: string;
}

// --- 问答请求/响应 ---

export interface ChatRequest {
  prompt: string;
  models: string[];
}

export interface TaskCreated {
  taskId: string;
  models: string[];
  createdAt: string;
}

// --- 流式事件 ---

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
  code: 'TIMEOUT' | 'PROVIDER_ERROR' | 'RATE_LIMITED';
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
  | { type: 'chunk'; data: ChunkEvent }
  | { type: 'done'; data: DoneEvent }
  | { type: 'error'; data: ErrorEvent }
  | { type: 'judge'; data: JudgeEvent }
  | { type: 'judge_error'; data: { error: string } }
  | { type: 'fusion'; data: FusionEvent }
  | { type: 'complete'; data: CompleteEvent };

// --- 聊天状态（前端） ---

export interface AnswerState {
  model: string;
  content: string;
  status: 'streaming' | 'done' | 'error';
  latencyMs?: number;
  error?: string;
}

export type ChatStatus = 'idle' | 'streaming' | 'judging' | 'fusing' | 'complete';

export interface ChatState {
  status: ChatStatus;
  prompt: string;
  answers: Record<string, AnswerState>;
  judgeResult?: JudgeEvent;
  fusionResult?: FusionEvent;
  taskId?: string;
}

// --- 运行时配置 ---

export interface RuntimeConfig {
  judgeModel: string;
  judgeProvider: string;
  singleModelTimeoutS: number;
  maxPromptLength: number;
  modelsCount: number;
}
