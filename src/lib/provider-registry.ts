// ============================================================
// Provider 注册中心
// 从环境变量读取配置，自动注册可用的 Provider
// ============================================================

import { taskManager } from './task-manager';
import { BUILTIN_MODELS, type BuiltinModelDef } from './model-registry';
import { OpenAICompatProvider } from './providers/openai-compat';
import { AnthropicProvider } from './providers/anthropic';
import { GoogleProvider } from './providers/google';

export type ModelDef = {
  id: string;
  displayName: string;
  providerType: string;
  description: string;
  configured: boolean;
};

/** 根据模型类型创建 Provider 实例 */
function createProvider(def: BuiltinModelDef): InstanceType<typeof OpenAICompatProvider | typeof AnthropicProvider | typeof GoogleProvider> | null {
  const apiKey = process.env[def.envKeyName];
  if (!apiKey) return null;

  const baseUrl = process.env[`${def.storagePrefix}_BASE_URL` as keyof typeof process.env] as string | undefined;

  switch (def.providerType) {
    case 'openai_compat':
      return new OpenAICompatProvider({
        name: def.id,
        apiBase: baseUrl || def.defaultBaseUrl,
        apiKey,
        modelId: process.env[`${def.storagePrefix}_MODEL_ID` as keyof typeof process.env] as string || def.defaultModelId,
      });
    case 'anthropic':
      return new AnthropicProvider({
        apiKey,
        modelId: process.env.CLAUDE_MODEL_ID || def.defaultModelId,
      });
    case 'google':
      return new GoogleProvider({
        apiKey,
        modelId: process.env.GEMINI_MODEL_ID || def.defaultModelId,
      });
    default:
      return null;
  }
}

/**
 * 从环境变量读取并注册所有已配置的 Provider
 */
export function registerProvidersFromEnv(): ModelDef[] {
  const defs: ModelDef[] = [];

  for (const def of BUILTIN_MODELS) {
    const hasKey = !!process.env[def.envKeyName];
    const provider = hasKey ? createProvider(def) : null;

    if (provider) {
      taskManager.registerProvider(def.id, provider);
    }

    defs.push({
      id: def.id,
      displayName: def.displayName,
      providerType: def.providerType,
      description: hasKey ? def.description : `需配置 ${def.envKeyName}`,
      configured: hasKey,
    });
  }

  return defs;
}

/**
 * 获取所有模型的定义（含已配置/未配置状态）
 */
export function initializeProviders(): ModelDef[] {
  return registerProvidersFromEnv();
}
