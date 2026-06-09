// ============================================================
// 模型管理 API — 获取可用模型列表
// ============================================================

import { NextResponse } from 'next/server';
import { initializeProviders } from '@/lib/provider-registry';

const MODEL_META: Record<string, { displayName: string; description: string }> = {
  deepseek: { displayName: 'DeepSeek V3', description: 'DeepSeek 官方 API' },
  qwen: { displayName: '通义千问 Qwen3', description: '阿里百炼 API' },
  claude: { displayName: 'Claude Sonnet 4', description: 'Anthropic API' },
  gemini: { displayName: 'Gemini 2.5 Pro', description: 'Google AI Studio' },
};

export async function GET() {
  const defs = initializeProviders();

  const models = defs.map((d) => ({
    name: d.id,
    display_name: d.displayName,
    provider_type: d.providerType,
    enabled: d.configured,
    description: d.description,
  }));

  return NextResponse.json({
    models,
    judge_model: process.env.JUDGE_MODEL ?? 'gpt-4o',
  });
}
