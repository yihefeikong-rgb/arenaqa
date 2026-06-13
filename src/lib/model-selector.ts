// ============================================================
// 模型选择器 — 统一 API Key / Base URL / Model ID 选择逻辑
// 供 Judge、Fusion、Summarizer 共用
// ============================================================

import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

export interface ResolvedModel {
  apiKey: string;
  baseUrl: string;
  modelId: string;
  client: ReturnType<typeof createOpenAI>;
}

/**
 * 解析最优先可用的 AI 模型配置
 * 优先级：judgeConfig > DEEPSEEK_API_KEY > OPENAI_API_KEY > NIM_API_KEY
 */
export function resolveModel(judgeConfig?: { apiKey: string; baseUrl: string; modelId: string } | null): ResolvedModel | null {
  let apiKey = judgeConfig?.apiKey || '';
  let baseUrl = judgeConfig?.baseUrl || '';
  let modelId = judgeConfig?.modelId || '';

  const isDsKey = apiKey.startsWith('sk-');

  if (!apiKey) {
    if (process.env.DEEPSEEK_API_KEY) {
      apiKey = process.env.DEEPSEEK_API_KEY;
      baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
      modelId = 'deepseek-chat';
    } else if (process.env.OPENAI_API_KEY) {
      apiKey = process.env.OPENAI_API_KEY;
      baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      modelId = 'gpt-4o';
    } else if (process.env.NIM_API_KEY) {
      apiKey = process.env.NIM_API_KEY;
      baseUrl = 'https://integrate.api.nvidia.com/v1';
      modelId = 'deepseek-ai/deepseek-v4-flash';
    }
  } else {
    if (isDsKey) {
      baseUrl = baseUrl || 'https://api.deepseek.com/v1';
      modelId = modelId || 'deepseek-chat';
    } else {
      modelId = modelId || 'gpt-4o';
    }
  }

  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl,
    modelId,
    client: createOpenAI({ apiKey, baseURL: baseUrl || undefined }),
  };
}

/** 获取 LanguageModel 实例（用于 Vercel AI SDK） */
export function getLanguageModel(resolved: ResolvedModel): LanguageModel {
  return resolved.client.chat(resolved.modelId) as LanguageModel;
}
