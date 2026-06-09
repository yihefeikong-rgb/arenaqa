// ============================================================
// Provider 注册中心
// 从环境变量读取配置，自动注册可用的 Provider
// ============================================================

import { taskManager } from './task-manager';
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

/**
 * 从环境变量读取并注册所有已配置的 Provider
 */
export function registerProvidersFromEnv(): ModelDef[] {
  const defs: ModelDef[] = [];

  // ---- DeepSeek (OpenAI-compatible) ----
  if (process.env.DEEPSEEK_API_KEY) {
    taskManager.registerProvider(
      'deepseek',
      new OpenAICompatProvider({
        name: 'deepseek',
        apiBase: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
        apiKey: process.env.DEEPSEEK_API_KEY,
        modelId: 'deepseek-chat',
      })
    );
    defs.push({
      id: 'deepseek',
      displayName: 'DeepSeek V3',
      providerType: 'openai_compat',
      description: 'DeepSeek 官方 API，性价比极高',
      configured: true,
    });
  } else {
    defs.push({
      id: 'deepseek',
      displayName: 'DeepSeek V3',
      providerType: 'openai_compat',
      description: '需配置 DEEPSEEK_API_KEY',
      configured: false,
    });
  }

  // ---- 通义千问 (OpenAI-compatible) ----
  if (process.env.QWEN_API_KEY) {
    taskManager.registerProvider(
      'qwen',
      new OpenAICompatProvider({
        name: 'qwen',
        apiBase: process.env.QWEN_BASE_URL ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: process.env.QWEN_API_KEY,
        modelId: 'qwen-plus',
      })
    );
    defs.push({
      id: 'qwen',
      displayName: '通义千问 Qwen3',
      providerType: 'openai_compat',
      description: '阿里百炼 API',
      configured: true,
    });
  } else {
    defs.push({
      id: 'qwen',
      displayName: '通义千问 Qwen3',
      providerType: 'openai_compat',
      description: '需配置 QWEN_API_KEY',
      configured: false,
    });
  }

  // ---- Anthropic Claude ----
  if (process.env.ANTHROPIC_API_KEY) {
    taskManager.registerProvider(
      'claude',
      new AnthropicProvider({
        apiKey: process.env.ANTHROPIC_API_KEY,
        modelId: process.env.CLAUDE_MODEL_ID,
      })
    );
    defs.push({
      id: 'claude',
      displayName: 'Claude Sonnet 4',
      providerType: 'anthropic',
      description: 'Anthropic API，代码能力最强',
      configured: true,
    });
  } else {
    defs.push({
      id: 'claude',
      displayName: 'Claude Sonnet 4',
      providerType: 'anthropic',
      description: '需配置 ANTHROPIC_API_KEY',
      configured: false,
    });
  }

  // ---- Google Gemini ----
  if (process.env.GEMINI_API_KEY) {
    taskManager.registerProvider(
      'gemini',
      new GoogleProvider({
        apiKey: process.env.GEMINI_API_KEY,
        modelId: process.env.GEMINI_MODEL_ID,
      })
    );
    defs.push({
      id: 'gemini',
      displayName: 'Gemini 2.5 Pro',
      providerType: 'google',
      description: 'Google AI Studio，多模态能力强',
      configured: true,
    });
  } else {
    defs.push({
      id: 'gemini',
      displayName: 'Gemini 2.5 Pro',
      providerType: 'google',
      description: '需配置 GEMINI_API_KEY',
      configured: false,
    });
  }

  return defs;
}

/**
 * 获取所有模型的定义（含已配置/未配置状态）
 */
let _modelDefs: ModelDef[] = [];

export function initializeProviders(): ModelDef[] {
  if (_modelDefs.length === 0) {
    _modelDefs = registerProvidersFromEnv();
  }
  return _modelDefs;
}
