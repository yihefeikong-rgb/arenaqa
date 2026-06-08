// GET /api/chat/stream/[taskId] — SSE 流式接收
import { NextRequest } from 'next/server';
import { sseManager } from '@/lib/sse-manager';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  // 前置检查：task 不存在且未完成
  const cached = sseManager.getCachedEvents(taskId);
  if (cached.length === 0 && !sseManager.isTaskCompleted(taskId)) {
    // 有可能 task 刚创建但还没事件，不返回 404
    // 只有在 task 完全不存在时才返回 404
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 发送初始连接确认
      controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'));

      // 订阅 SSE 事件
      const unsubscribe = sseManager.subscribe(taskId, (event) => {
        const data = `event: ${event.event}\ndata: ${event.data}\n\n`;
        controller.enqueue(encoder.encode(data));

        if (event.event === 'complete') {
          controller.close();
          unsubscribe();
        }
      });

      // 如果 task 已经完成，订阅后会立即推送所有缓存事件并 close
      // 但如果还没事件进来，保持连接打开
    },
    cancel() {
      // 客户端断开连接
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
