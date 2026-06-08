// ============================================================
// 任务管理器 — 管理问答任务的生命周期
// ============================================================

import { randomUUID } from 'crypto';
import { BaseProvider } from './providers/base';
import { sseManager } from './sse-manager';
import type { ChatRequest } from '@/types';

interface RunningTask {
  taskId: string;
  prompt: string;
  models: string[];
  controllers: Map<string, AbortController>;
  startTime: number;
  completed: boolean;
}

class TaskManager {
  private tasks = new Map<string, RunningTask>();
  private providers = new Map<string, BaseProvider>();

  registerProvider(name: string, provider: BaseProvider): void {
    this.providers.set(name, provider);
  }

  getAvailableModels(): string[] {
    return Array.from(this.providers.keys());
  }

  async startTask(req: ChatRequest): Promise<string> {
    const taskId = `task_${randomUUID().slice(0, 8)}`;
    const startTime = Date.now();

    const task: RunningTask = {
      taskId,
      prompt: req.prompt,
      models: req.models,
      controllers: new Map(),
      startTime,
      completed: false,
    };
    this.tasks.set(taskId, task);

    // 启动所有模型（并发送到各自 provider）
    const promises = req.models.map((model) =>
      this.runModel(task, model).catch((err) => {
        sseManager.publish(taskId, 'error', {
          model,
          error: err.message,
          code: 'PROVIDER_ERROR',
        });
      })
    );

    // 等所有模型完成
    Promise.allSettled(promises).then(async () => {
      const elapsed = Date.now() - startTime;

      // 检查是否全失败
      const errors = task.controllers.size === 0; // 没有成功启动的
      if (errors) {
        sseManager.publish(taskId, 'complete', {
          taskId,
          totalLatencyMs: elapsed,
          allFailed: true,
        });
        sseManager.complete(taskId);
        return;
      }

      // TODO: 调用裁判评分 + 融合（Phase 2）
      // await this.runJudge(taskId);
      // await this.runFusion(taskId);

      sseManager.publish(taskId, 'complete', {
        taskId,
        totalLatencyMs: elapsed,
      });
      sseManager.complete(taskId);
    });

    return taskId;
  }

  private async runModel(task: RunningTask, modelName: string): Promise<void> {
    const provider = this.providers.get(modelName);
    if (!provider) {
      throw new Error(`Provider not found: ${modelName}`);
    }

    const controller = new AbortController();
    task.controllers.set(modelName, controller);

    // 超时控制
    const timeout = setTimeout(() => {
      controller.abort();
      sseManager.publish(task.taskId, 'error', {
        model: modelName,
        error: 'Response timeout',
        code: 'TIMEOUT',
      });
    }, 45_000);

    let index = 0;
    let totalChars = 0;
    const modelStart = Date.now();

    try {
      for await (const chunk of provider.stream(task.prompt, controller.signal)) {
        sseManager.publish(task.taskId, 'chunk', {
          model: modelName,
          content: chunk,
          index: index++,
        });
        totalChars += chunk.length;
      }

      clearTimeout(timeout);
      sseManager.publish(task.taskId, 'done', {
        model: modelName,
        latencyMs: Date.now() - modelStart,
        totalChars,
      });
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') return;
      throw err;
    }
  }

  abortTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.completed) return false;

    for (const controller of task.controllers.values()) {
      controller.abort();
    }
    task.completed = true;

    sseManager.publish(taskId, 'complete', {
      taskId,
      totalLatencyMs: Date.now() - task.startTime,
    });
    sseManager.complete(taskId);

    return true;
  }
}

export const taskManager = new TaskManager();
