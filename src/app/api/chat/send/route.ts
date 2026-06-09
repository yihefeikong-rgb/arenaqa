// POST /api/chat/send — 发起新问答
import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/task-manager';
import type { ChatRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();

    // 验证
    if (!body.prompt?.trim()) {
      return NextResponse.json({ detail: 'Prompt is required' }, { status: 422 });
    }
    if (!body.models?.length) {
      return NextResponse.json({ detail: 'At least one model is required' }, { status: 400 });
    }

    // 模型校验：支持 .env 注册的 + 请求中携带 apiKeys 的 + 自定义模型
    const registered = taskManager.getAvailableModels();
    const hasKey = body.apiKeys ? Object.keys(body.apiKeys) : [];
    const customIds = (body.customModels || []).map((m) => m.id);
    const allValid = [...registered, ...hasKey, ...customIds];
    const invalid = body.models.filter((m) => !allValid.includes(m) && !m.startsWith("nim-"));
    if (invalid.length > 0) {
      return NextResponse.json(
        { detail: `Invalid models: ${invalid.join(', ')}` },
        { status: 400 }
      );
    }

    const taskId = await taskManager.startTask(body);

    return NextResponse.json(
      {
        taskId,
        models: body.models,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
