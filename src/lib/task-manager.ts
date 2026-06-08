// ============================================================
// 任务管理器 — 管理问答任务的生命周期
// 支持运行时 API Key，用户可通过前端设置面板临时配置
// ============================================================

import { randomUUID } from "crypto";
import { BaseProvider } from "./providers/base";
import { OpenAICompatProvider } from "./providers/openai-compat";
import { AnthropicProvider } from "./providers/anthropic";
import { GoogleProvider } from "./providers/google";
import { sseManager } from "./sse-manager";
import { runJudge } from "./judge";
import { runFusion } from "./fusion";
import type { ChatRequest } from "@/types";

interface RunningTask {
  taskId: string;
  prompt: string;
  models: string[];
  controllers: Map<string, AbortController>;
  answers: Map<string, string>;
  completedModels: Set<string>;
  failedModels: Set<string>;
  startTime: number;
  completed: boolean;
  runtimeProviders: Map<string, BaseProvider>;
}

// 模型→环境变量 Key 的映射
const MODEL_KEY_MAP: Record<string, string> = {
  deepseek: "DEEPSEEK_API_KEY",
  qwen: "QWEN_API_KEY",
  claude: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
};

const MODEL_BASE_URL: Record<string, string> = {
  deepseek: "https://api.deepseek.com",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
};

const MODEL_ID: Record<string, string> = {
  deepseek: "deepseek-chat",
  qwen: "qwen-plus",
};

class TaskManager {
  private tasks = new Map<string, RunningTask>();
  private providers = new Map<string, BaseProvider>();

  registerProvider(name: string, provider: BaseProvider): void {
    this.providers.set(name, provider);
  }

  getAvailableModels(): string[] {
    return Array.from(this.providers.keys());
  }

  /** 创建运行时 Provider（使用用户从设置面板传入的 Key） */
  private createRuntimeProvider(
    modelName: string,
    apiKey: string
  ): BaseProvider {
    switch (modelName) {
      case "deepseek":
      case "qwen":
        return new OpenAICompatProvider({
          name: modelName,
          apiBase: MODEL_BASE_URL[modelName],
          apiKey,
          modelId: MODEL_ID[modelName],
        });
      case "claude":
        return new AnthropicProvider({ apiKey, modelId: process.env.CLAUDE_MODEL_ID });
      case "gemini":
        return new GoogleProvider({ apiKey, modelId: process.env.GEMINI_MODEL_ID });
      default:
        throw new Error(`Unknown model: ${modelName}`);
    }
  }

  async startTask(req: ChatRequest): Promise<string> {
    const taskId = `task_${randomUUID().slice(0, 8)}`;
    const startTime = Date.now();

    // 使用运行时传入的 apiKeys 创建临时 Provider
    const runtimeProviders = new Map<string, BaseProvider>();
    if (req.apiKeys) {
      for (const [model, key] of Object.entries(req.apiKeys)) {
        if (key && req.models.includes(model)) {
          try {
            runtimeProviders.set(model, this.createRuntimeProvider(model, key));
          } catch {
            // 创建失败则 fallback 到已注册的 provider
          }
        }
      }
    }

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
      runtimeProviders,
    };
    this.tasks.set(taskId, task);

    const promises = req.models.map((model) =>
      this.runModel(task, model).catch((err) => {
        task.failedModels.add(model);
        sseManager.publish(taskId, "error", {
          model,
          error: err.message,
          code: "PROVIDER_ERROR",
        });
      })
    );

    Promise.allSettled(promises).then(async () => {
      const elapsed = Date.now() - startTime;

      if (task.completedModels.size === 0) {
        sseManager.publish(taskId, "complete", { taskId, totalLatencyMs: elapsed, allFailed: true });
        sseManager.complete(taskId);
        return;
      }

      try {
        const answersArr = req.models
          .filter((m) => task.completedModels.has(m))
          .map((m) => ({ model: m, content: task.answers.get(m) ?? "" }));

        const judgeResult = await runJudge(taskId, req.prompt, answersArr);
        sseManager.publish(taskId, "judge", judgeResult);

        try {
          const fusionResult = await runFusion(taskId, req.prompt, answersArr);
          sseManager.publish(taskId, "fusion", fusionResult);
        } catch (fusionErr) {
          sseManager.publish(taskId, "judge_error", {
            error: fusionErr instanceof Error ? fusionErr.message : "Fusion failed",
          });
        }
      } catch (judgeErr) {
        sseManager.publish(taskId, "judge_error", {
          error: judgeErr instanceof Error ? judgeErr.message : "Judge failed",
        });
      }

      sseManager.publish(taskId, "complete", { taskId, totalLatencyMs: Date.now() - startTime });
      sseManager.complete(taskId);
      task.completed = true;
    });

    return taskId;
  }

  private async runModel(task: RunningTask, modelName: string): Promise<void> {
    // 优先使用运行时传入的 Provider（用户设置面板配置的 Key）
    let provider = task.runtimeProviders.get(modelName);
    if (!provider) {
      provider = this.providers.get(modelName);
    }
    if (!provider) {
      throw new Error(`Provider not found: ${modelName}. 请在设置中配置 API Key。`);
    }

    const controller = new AbortController();
    task.controllers.set(modelName, controller);

    const timeout = setTimeout(() => {
      controller.abort();
      sseManager.publish(task.taskId, "error", {
        model: modelName,
        error: "Response timeout",
        code: "TIMEOUT",
      });
    }, 45_000);

    let index = 0;
    let totalChars = 0;
    let accumulated = "";
    const modelStart = Date.now();

    try {
      for await (const chunk of provider.stream(task.prompt, controller.signal)) {
        accumulated += chunk;
        sseManager.publish(task.taskId, "chunk", {
          model: modelName,
          content: chunk,
          index: index++,
        });
        totalChars += chunk.length;
      }

      clearTimeout(timeout);
      task.answers.set(modelName, accumulated);
      task.completedModels.add(modelName);

      sseManager.publish(task.taskId, "done", {
        model: modelName,
        latencyMs: Date.now() - modelStart,
        totalChars,
      });
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") return;
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

    sseManager.publish(taskId, "complete", { taskId, totalLatencyMs: Date.now() - task.startTime });
    sseManager.complete(taskId);

    return true;
  }
}

export const taskManager = new TaskManager();
