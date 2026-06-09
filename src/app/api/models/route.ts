// ============================================================
// 模型管理 API — 获取可用模型列表
// ============================================================

import { NextResponse } from 'next/server';
import { initializeProviders } from '@/lib/provider-registry';
import { FREE_MODELS } from '@/config/freeModels';

const MODEL_META: Record<string, { displayName: string; description: string }> = {
  deepseek: { displayName: 'DeepSeek V3', description: 'DeepSeek 官方 API' },
  qwen: { displayName: '通义千问 Qwen3', description: '阿里百炼 API' },
  claude: { displayName: 'Claude Sonnet 4', description: 'Anthropic API' },
  gemini: { displayName: 'Gemini 2.5 Pro', description: 'Google AI Studio' },
};

// 给免费模型做健康检测
async function checkFreeHealth(): Promise<Record<string, 'healthy' | 'unhealthy' | 'dead'>> {
  const checks = FREE_MODELS.map(async (fm) => {
    try {
      const res = await fetch(`http://localhost:${fm.port}/v1/models`, {
        signal: AbortSignal.timeout(5000),
      });
      const ok = res.ok || res.status === 401 || res.status === 403; // 有响应就算活着
      return [fm.id, ok ? 'healthy' : 'unhealthy' as const];
    } catch {
      return [fm.id, 'dead' as const];
    }
  });
  const results = await Promise.allSettled(checks);
  const health: Record<string, 'healthy' | 'unhealthy' | 'dead'> = {};
  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      const [id, status] = r.value;
      health[id as string] = status as 'healthy' | 'unhealthy' | 'dead';
    }
  });
  return health;
}

export async function GET() {
  const defs = initializeProviders();

  const models = defs.map((d) => ({
    name: d.id,
    display_name: d.displayName,
    provider_type: d.providerType,
    enabled: d.configured,
    description: d.description,
  }));

  // 后台异步检测免费模型健康度（不阻塞主流程）
  const freeHealth = await checkFreeHealth();

  return NextResponse.json({
    models,
    judge_model: process.env.JUDGE_MODEL ?? 'gpt-4o',
    freeHealth,
  });
}
