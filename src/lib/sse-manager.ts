// ============================================================
// SSE 事件管理器
// 为每个 task_id 维护事件队列 + 订阅者列表
// ============================================================

export type SSEEventListener = (event: { event: string; data: string }) => void;

interface TaskStream {
  taskId: string;
  subscribers: Set<SSEEventListener>;
  events: Array<{ event: string; data: string }>;
  completed: boolean;
  cleanupTimer?: ReturnType<typeof setTimeout>;
}

export class SSEManager {
  private tasks = new Map<string, TaskStream>();
  private readonly CLEANUP_MS = 5 * 60 * 1000; // 5 分钟清理

  subscribe(taskId: string, listener: SSEEventListener): () => void {
    let stream = this.tasks.get(taskId);
    if (!stream) {
      stream = { taskId, subscribers: new Set(), events: [], completed: false };
      this.tasks.set(taskId, stream);
    }

    // 如果 task 已完成，立即推送所有缓存事件
    if (stream.completed) {
      for (const evt of stream.events) {
        listener(evt);
      }
      return () => {}; // 无需取消
    }

    // 先推送已有的事件
    for (const evt of stream.events) {
      listener(evt);
    }

    stream.subscribers.add(listener);

    return () => {
      stream?.subscribers.delete(listener);
    };
  }

  publish(taskId: string, event: string, data: unknown): void {
    const payload = { event, data: JSON.stringify(data) };
    const stream = this.tasks.get(taskId);
    if (!stream) return;

    stream.events.push(payload);

    for (const listener of stream.subscribers) {
      listener(payload);
    }
  }

  complete(taskId: string): void {
    const stream = this.tasks.get(taskId);
    if (!stream) return;

    stream.completed = true;
    stream.subscribers.clear();

    // 5 分钟后清理
    stream.cleanupTimer = setTimeout(() => {
      this.tasks.delete(taskId);
    }, this.CLEANUP_MS);
  }

  isTaskCompleted(taskId: string): boolean {
    return this.tasks.get(taskId)?.completed ?? false;
  }

  // 用于断线重连：获取已缓存的所有事件
  getCachedEvents(taskId: string): Array<{ event: string; data: string }> {
    return this.tasks.get(taskId)?.events ?? [];
  }
}

// 全局单例
export const sseManager = new SSEManager();
