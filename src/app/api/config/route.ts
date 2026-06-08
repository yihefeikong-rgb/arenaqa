// GET/PUT /api/config — 运行时配置管理
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    judgeModel: process.env.JUDGE_MODEL ?? 'gpt-4o',
    judgeProvider: process.env.JUDGE_PROVIDER ?? 'openai',
    singleModelTimeoutS: Number(process.env.SINGLE_MODEL_TIMEOUT_S ?? 45),
    maxPromptLength: Number(process.env.MAX_PROMPT_LENGTH ?? 4000),
    modelsCount: 0, // 动态计算
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  // 仅允许更新非敏感字段
  // API Key 通过 .env 管理，不走此接口
  const allowed = ['judgeModel', 'singleModelTimeoutS', 'maxPromptLength'];
  const updates: Record<string, unknown> = {};

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  // 实际项目中写入配置存储

  return NextResponse.json({
    judgeModel: process.env.JUDGE_MODEL ?? 'gpt-4o',
    judgeProvider: process.env.JUDGE_PROVIDER ?? 'openai',
    singleModelTimeoutS: updates.singleModelTimeoutS ?? Number(process.env.SINGLE_MODEL_TIMEOUT_S ?? 45),
    maxPromptLength: updates.maxPromptLength ?? Number(process.env.MAX_PROMPT_LENGTH ?? 4000),
    modelsCount: 0,
  });
}
