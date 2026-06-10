// POST /api/chat/stop/[taskId] — 停止单个模型
import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/task-manager';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const body = await req.json().catch((e) => { console.warn('[stop] JSON parse failed', e); return {}; });
  const { model } = body as { model?: string };

  if (!model) {
    return NextResponse.json({ error: "缺少 model" }, { status: 400 });
  }

  const stopped = taskManager.stopModel(taskId, model);
  return NextResponse.json({ taskId, model, stopped });
}
