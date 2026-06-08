// POST /api/chat/abort/[taskId] — 中断任务
import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/task-manager';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const aborted = taskManager.abortTask(taskId);

  return NextResponse.json({ taskId, aborted });
}
