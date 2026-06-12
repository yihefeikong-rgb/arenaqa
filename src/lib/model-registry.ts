// ============================================================
// 模型注册中心 — 单一数据源
// 所有模型配置在此定义，其他地方只引用
// ============================================================

/** 内置模型定义 */
export interface BuiltinModelDef {
  id: string;
  displayName: string;
  providerType: 'openai_compat' | 'anthropic' | 'google';
  description: string;
  envKeyName: string;       // 环境变量名（如 DEEPSEEK_API_KEY）
  storagePrefix: string;    // localStorage 前缀（如 DEEPSEEK）
  defaultBaseUrl: string;
  defaultModelId: string;
  keyHint: string;
}

export const BUILTIN_MODELS: BuiltinModelDef[] = [
  {
    id: 'deepseek',
    displayName: 'DeepSeek V3',
    providerType: 'openai_compat',
    description: 'DeepSeek 官方 API，性价比极高',
    envKeyName: 'DEEPSEEK_API_KEY',
    storagePrefix: 'DEEPSEEK',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModelId: 'deepseek-chat',
    keyHint: 'platform.deepseek.com',
  },
  {
    id: 'qwen',
    displayName: '通义千问 Qwen3',
    providerType: 'openai_compat',
    description: '阿里百炼 API',
    envKeyName: 'QWEN_API_KEY',
    storagePrefix: 'QWEN',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModelId: 'qwen-plus',
    keyHint: '阿里云百炼',
  },
  {
    id: 'claude',
    displayName: 'Claude Sonnet 4',
    providerType: 'anthropic',
    description: 'Anthropic API，代码能力最强',
    envKeyName: 'ANTHROPIC_API_KEY',
    storagePrefix: 'ANTHROPIC',
    defaultBaseUrl: '',
    defaultModelId: 'claude-sonnet-4-20250514',
    keyHint: 'console.anthropic.com',
  },
  {
    id: 'gemini',
    displayName: 'Gemini 2.5 Pro',
    providerType: 'google',
    description: 'Google AI Studio，多模态能力强',
    envKeyName: 'GEMINI_API_KEY',
    storagePrefix: 'GEMINI',
    defaultBaseUrl: '',
    defaultModelId: 'gemini-2.5-pro-preview-05-06',
    keyHint: 'aistudio.google.com',
  },
];

/** 获取内置模型的 localStorage Key 名 */
export function getLocalStorageKey(prefix: string, suffix: string): string {
  return `arenaqa-${prefix}_${suffix}`;
}

/** 通过模型 id 查找内置模型定义 */
export function findBuiltinModel(id: string): BuiltinModelDef | undefined {
  return BUILTIN_MODELS.find((m) => m.id === id);
}
