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
  deepseek: "https://api.deepseek.com/v1",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
};

const MODEL_ID: Record<string, string> = {
  deepseek: "deepseek-chat",
  qwen: "qwen-plus",
};

class TaskManager {
  private tasks = new Map<string, RunningTask>();
  private providers = new Map<string, BaseProvider>();
  private _customModels: Array<{ id: string; name: string; apiBase: string; modelId: string }> = [];
  private _judgeConfig: { apiKey: string; baseUrl: string; modelId: string } | null = null;

  registerProvider(name: string, provider: BaseProvider): void {
    this.providers.set(name, provider);
  }

  getAvailableModels(): string[] {
    return Array.from(this.providers.keys());
  }

  /** 创建运行时 Provider（使用用户从设置面板传入的 Key + BaseURL + ModelID） */
  private createRuntimeProvider(
    modelName: string,
    apiKey: string,
    overrideBaseUrl?: string,
    overrideModelId?: string
  ): BaseProvider {
    switch (modelName) {
      case "deepseek":
      case "qwen":
        return new OpenAICompatProvider({
          name: modelName,
          apiBase: overrideBaseUrl || MODEL_BASE_URL[modelName],
          apiKey,
          modelId: overrideModelId || MODEL_ID[modelName],
        });
      case "claude":
        return new AnthropicProvider({ apiKey, modelId: overrideModelId || process.env.CLAUDE_MODEL_ID });
      case "gemini":
        return new GoogleProvider({ apiKey, modelId: overrideModelId || process.env.GEMINI_MODEL_ID });
      default:
        // 检查自定义模型（custom- 开头的 + nim- 开头的等）
        const def = this._customModels.find((m) => m.id === modelName);
        if (def) {
          return new OpenAICompatProvider({
            name: modelName,
            apiBase: def.apiBase,
            apiKey,
            modelId: def.modelId,
          });
        }
        throw new Error(`Unknown model: ${modelName}`);
    }
  }

  async startTask(req: ChatRequest): Promise<string> {
    const taskId = `task_${randomUUID().slice(0, 8)}`;
    console.log(`[startTask] taskId=${taskId} models=${req.models.join(',')} providers=${this.providers.size}`);
    const startTime = Date.now();

    // 暂存本次请求的自定义模型和裁判配置
    this._customModels = req.customModels || [];
    this._judgeConfig = req.judgeConfig || null;

    // 构建 model → config 映射
    const configMap = new Map<string, { apiBase?: string; modelId?: string }>();
    if (req.modelConfigs) {
      req.modelConfigs.forEach((c) => configMap.set(c.model, { apiBase: c.apiBase, modelId: c.modelId }));
    }

    // 使用运行时传入的 apiKeys 创建临时 Provider
    const runtimeProviders = new Map<string, BaseProvider>();
    if (req.apiKeys) {
      for (const [model, key] of Object.entries(req.apiKeys)) {
        if (key && req.models.includes(model)) {
          try {
            const cfg = configMap.get(model);
            runtimeProviders.set(model, this.createRuntimeProvider(model, key, cfg?.apiBase, cfg?.modelId));
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
        console.error(`[runModel] FAILED for ${model}: ${err.message}`);
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

        const judgeResult = await runJudge(taskId, req.prompt, answersArr, this._judgeConfig);
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
    console.log(`[runModel] starting for ${modelName} task=${task.taskId}`);

    // 优先使用运行时传入的 Provider（用户设置面板配置的 Key）
    let provider = task.runtimeProviders.get(modelName);
    if (!provider) {
      provider = this.providers.get(modelName);
    }
    if (!provider) {
      const msg = `Provider not found: ${modelName}. 请在设置中配置 API Key。`;
      console.error(`[runModel] ${msg} (runtimeProviders: ${task.runtimeProviders.size}, registeredProviders: ${this.providers.size})`);
      throw new Error(msg);
    }

    console.log(`[runModel] provider ready for ${modelName}, calling stream...`);

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

// 全局单例 — 使用 globalThis 防止 Next.js HMR 重置
const globalForTask = globalThis as unknown as { __taskManager?: TaskManager };
export const taskManager: TaskManager =
  globalForTask.__taskManager ?? (globalForTask.__taskManager = new TaskManager());
