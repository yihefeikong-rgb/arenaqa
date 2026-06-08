// GET /api/models — 获取可用模型列表
import { NextResponse } from 'next/server';
import { taskManager } from '@/lib/task-manager';

export async function GET() {
  const models = taskManager.getAvailableModels();

  // 默认模型定义（仅返回已注册的）
  const modelDefs = models.map((name) => {
    const defs: Record<string, { displayName: string; description: string }> = {
      deepseek: { displayName: 'DeepSeek V3', description: 'DeepSeek 官方 API' },
      qwen: { displayName: '通义千问 Qwen3', description: '阿里百炼 API' },
      claude: { displayName: 'Claude Sonnet 4', description: 'Anthropic API' },
      gemini: { displayName: 'Gemini 2.5 Pro', description: 'Google AI Studio' },
    };
    return {
      name,
      ...(defs[name] ?? { displayName: name, description: '' }),
      enabled: true,
    };
  });

  return NextResponse.json({
    models: modelDefs,
    judgeModel: process.env.JUDGE_MODEL ?? 'gpt-4o',
  });
}
