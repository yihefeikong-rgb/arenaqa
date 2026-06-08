// ============================================================
// 任务管理器 — 管理问答任务的生命周期
// ============================================================

import { randomUUID } from 'crypto';
import { BaseProvider } from './providers/base';
import { sseManager } from './sse-manager';
import { runJudge } from './judge';
import { runFusion } from './fusion';
import type { ChatRequest } from '@/types';

interface RunningTask {
  taskId: string;
  prompt: string;
  models: string[];
  controllers: Map<string, AbortController>;
  answers: Map<string, string>;  // model → accumulated text
  completedModels: Set<string>;
  failedModels: Set<string>;
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
      answers: new Map(),
      completedModels: new Set(),
      failedModels: new Set(),
      startTime,
      completed: false,
    };
    this.tasks.set(taskId, task);

    // 并发启动所有模型
    const promises = req.models.map((model) =>
      this.runModel(task, model).catch((err) => {
        task.failedModels.add(model);
        sseManager.publish(taskId, 'error', {
          model,
          error: err.message,
          code: 'PROVIDER_ERROR',
        });
      })
    );

    // 全部完成后触发评分+融合
    Promise.allSettled(promises).then(async () => {
      const elapsed = Date.now() - startTime;

      // 检查是否全失败
      if (task.completedModels.size === 0) {
        sseManager.publish(taskId, 'complete', {
          taskId,
          totalLatencyMs: elapsed,
          allFailed: true,
        });
        sseManager.complete(taskId);
        return;
      }

      // Phase 2: 裁判评分
      try {
        const answersArr = req.models
          .filter((m) => task.completedModels.has(m))
          .map((m) => ({
            model: m,
            content: task.answers.get(m) ?? '',
          }));

        const judgeResult = await runJudge(taskId, req.prompt, answersArr);
        sseManager.publish(taskId, 'judge', judgeResult);

        // Phase 2: 融合
        try {
          const fusionResult = await runFusion(taskId, req.prompt, answersArr);
          sseManager.publish(taskId, 'fusion', fusionResult);
        } catch (fusionErr) {
          sseManager.publish(taskId, 'judge_error', {
            error: fusionErr instanceof Error ? fusionErr.message : 'Fusion failed',
          });
        }
      } catch (judgeErr) {
        sseManager.publish(taskId, 'judge_error', {
          error: judgeErr instanceof Error ? judgeErr.message : 'Judge failed',
        });
      }

      sseManager.publish(taskId, 'complete', {
        taskId,
        totalLatencyMs: Date.now() - startTime,
      });
      sseManager.complete(taskId);
      task.completed = true;
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
    let accumulated = '';
    const modelStart = Date.now();

    try {
      for await (const chunk of provider.stream(task.prompt, controller.signal)) {
        accumulated += chunk;
        sseManager.publish(task.taskId, 'chunk', {
          model: modelName,
          content: chunk,
          index: index++,
        });
        totalChars += chunk.length;
      }

      clearTimeout(timeout);
      task.answers.set(modelName, accumulated);
      task.completedModels.add(modelName);

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
