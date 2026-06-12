// ============================================================
// 任务管理器 — 管理问答任务的生命周期
// 支持运行时 API Key，用户可通过前端设置面板临时配置
// ============================================================

import { randomUUID } from "crypto";
import { BUILTIN_MODELS, findBuiltinModel } from "./model-registry";
import { BaseProvider } from "./providers/base";
import { OpenAICompatProvider } from "./providers/openai-compat";
import { NimProvider } from "./providers/nim";
import { AnthropicProvider } from "./providers/anthropic";
import { GoogleProvider } from "./providers/google";
import { sseManager } from "./sse-manager";
import { runJudge } from "./judge";
import { runFusion } from "./fusion";
import type { ChatRequest } from "@/types";

/** Promise 超时封装 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
  ]);
}

const JUDGE_TIMEOUT_MS = 30_000;
const FUSION_TIMEOUT_MS = 60_000;

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

// 运行时 Provider 配置（从 model-registry 动态获取）
function getModelDefaults(id: string): { baseUrl: string; modelId: string } {
  const def = findBuiltinModel(id);
  if (def) return { baseUrl: def.defaultBaseUrl, modelId: def.defaultModelId };
  return { baseUrl: '', modelId: '' };
}

class TaskManager {
  private tasks = new Map<string, RunningTask>();
  private providers = new Map<string, BaseProvider>();
  private _customModels: Array<{ id: string; name: string; apiBase: string; modelId: string }> = [];
  private _judgeConfig: { apiKey: string; baseUrl: string; modelId: string } | null = null;
  /** 从前端请求中提取的 NIM API Key（用于 judge/fusion fallback） */
  private _requestNimKey: string | null = null;

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
    const defaults = getModelDefaults(modelName);

    switch (modelName) {
      case "deepseek":
      case "qwen":
        return new OpenAICompatProvider({
          name: modelName,
          apiBase: overrideBaseUrl || defaults.baseUrl,
          apiKey,
          modelId: overrideModelId || defaults.modelId,
        });
      case "claude":
        return new AnthropicProvider({ apiKey, modelId: overrideModelId || process.env.CLAUDE_MODEL_ID || defaults.modelId });
      case "gemini":
        return new GoogleProvider({ apiKey, modelId: overrideModelId || process.env.GEMINI_MODEL_ID || defaults.modelId });
      default:
        // 检查自定义模型（custom- 开头等）
        const def = this._customModels.find((m) => m.id === modelName);
        if (def) {
          // NIM 模型用专用 Provider（原生 fetch + 手动 SSE 解析，兼容性更好）
          if (modelName.startsWith("nim-")) {
            // 部分模型流式格式不标准，回退为非流式
            const nonStreamingModels = ["nim-kimi-k2.6", "nim-step-3.7-flash", "nim-qwen3.5-122b", "nim-yi-large"];
            return new NimProvider({
              name: modelName,
              apiKey,
              modelId: def.modelId,
              streaming: !nonStreamingModels.includes(modelName),
            });
          }
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

    // 从请求中提取 NIM API Key（前端 localStorage → req.apiKeys），供 judge/fusion fallback
    this._requestNimKey = null;
    if (req.apiKeys) {
      for (const [model, key] of Object.entries(req.apiKeys)) {
        if (key && model.startsWith("nim-")) {
          this._requestNimKey = key;
          break;
        }
      }
    }

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
            console.warn(`[task] createRuntimeProvider failed for ${model}, falling back to registered`);
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
        sseManager.publish(taskId, "judge_error", {
          error: "所有模型均返回失败，无法评分",
        });
        sseManager.publish(taskId, "complete", { taskId, totalLatencyMs: elapsed, allFailed: true });
        sseManager.complete(taskId);
        return;
      }

      try {
        const answersArr = req.models
          .filter((m) => task.completedModels.has(m))
          .map((m) => ({ model: m, content: task.answers.get(m) ?? "" }));

        console.log(`[task] running judge with ${answersArr.length} completed models`);
        const judgeResult = await withTimeout(
          runJudge(taskId, req.prompt, answersArr, this._judgeConfig),
          JUDGE_TIMEOUT_MS,
          'Judge'
        );
        console.log(`[task] judge done, scores=${judgeResult.scores.length}`);
        sseManager.publish(taskId, "judge", judgeResult);

        try {
          console.log('[task] running fusion...');
          const fusionKey = this._judgeConfig?.apiKey || this._requestNimKey || process.env.NIM_API_KEY || process.env.DEEPSEEK_API_KEY;
          const fusionBase = this._judgeConfig?.baseUrl || undefined;
          const fusionResult = await withTimeout(
            runFusion(taskId, req.prompt, answersArr, fusionKey, fusionBase),
            FUSION_TIMEOUT_MS,
            'Fusion'
          );
          console.log('[task] fusion done');
          sseManager.publish(taskId, "fusion", fusionResult);
        } catch (fusionErr) {
          console.error(`[task] fusion error: ${fusionErr instanceof Error ? fusionErr.message : fusionErr}`);
          // 融合失败时也发一个降级结果，让前端能看到原始回答
          const fallbackAnswers = req.models
            .filter((m) => task.completedModels.has(m))
            .map((m) => ({ model: m, content: task.answers.get(m) ?? "" }));
          const fallbackText = fallbackAnswers
            .slice(0, Math.min(fallbackAnswers.length, 6))
            .map((a) => `## ${a.model}\n\n${a.content}`)
            .join('\n\n---\n\n');
          sseManager.publish(taskId, "fusion", {
            consensus: ['融合引擎调用失败。以下为各模型原始回答：'],
            divergences: [],
            synthesized: fallbackText,
          });
        }
      } catch (judgeErr) {
        console.error(`[task] judge error: ${judgeErr instanceof Error ? judgeErr.message : judgeErr}`);

        // 如果用了自定义裁判配置失败了，用 NIM_API_KEY fallback 重试一次
        if (this._judgeConfig) {
          console.log('[task] retrying judge without custom config (NIM fallback)...');
          try {
            const answersArr = req.models
              .filter((m) => task.completedModels.has(m))
              .map((m) => ({ model: m, content: task.answers.get(m) ?? "" }));
            const judgeResult = await withTimeout(
              runJudge(taskId, req.prompt, answersArr, null), // null → NIM fallback
              JUDGE_TIMEOUT_MS,
              'Judge retry'
            );
            console.log(`[task] judge retry done, scores=${judgeResult.scores.length}`);
            sseManager.publish(taskId, "judge", judgeResult);

            try {
              const fusionKey = process.env.NIM_API_KEY || process.env.DEEPSEEK_API_KEY;
              const fusionResult = await withTimeout(
                runFusion(taskId, req.prompt, answersArr, fusionKey),
                FUSION_TIMEOUT_MS,
                'Fusion retry'
              );
              sseManager.publish(taskId, "fusion", fusionResult);
            } catch { console.warn('[task] NIM fallback fusion failed'); }
          } catch (retryErr) {
            console.error(`[task] judge retry also failed: ${retryErr}`);
            sseManager.publish(taskId, "judge_error", {
              error: retryErr instanceof Error ? retryErr.message : "Judge retry failed",
            });
          }
        } else {
          sseManager.publish(taskId, "judge_error", {
            error: judgeErr instanceof Error ? judgeErr.message : "Judge failed",
          });
        }
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

      task.answers.set(modelName, accumulated);
      task.completedModels.add(modelName);

      sseManager.publish(task.taskId, "done", {
        model: modelName,
        latencyMs: Date.now() - modelStart,
        totalChars,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        task.failedModels.add(modelName);
        sseManager.publish(task.taskId, "error", {
          model: modelName,
          error: "已停止",
          code: "TIMEOUT",
        });
        return;
      }
      throw err;
    }
  }

  /** 停止单个模型 */
  stopModel(taskId: string, modelName: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.completed) return false;
    const controller = task.controllers.get(modelName);
    if (!controller) return false;
    controller.abort();
    return true;
  }

  abortTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.completed) return false;

    for (const controller of task.controllers.values()) {
      controller.abort();
    }
    task.completed = true;

    // 用已完成的模型跑评分和融合
    this.finalizeWithCompleted(taskId).catch((e) => { console.warn('[task] finalizeWithCompleted failed in abort', e); });

    return true;
  }

  /** 用已完成的模型跑评分+融合，发布 complete */
  private async finalizeWithCompleted(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const completedArr = task.models
      .filter((m) => task.completedModels.has(m))
      .map((m) => ({ model: m, content: task.answers.get(m) ?? "" }));

    if (completedArr.length > 0) {
      try {
        const judgeResult = await runJudge(taskId, task.prompt, completedArr, this._judgeConfig);
        sseManager.publish(taskId, "judge", judgeResult);
      } catch { console.warn('[task] finalize judge failed'); }

      try {
        const fusionResult = await runFusion(taskId, task.prompt, completedArr);
        sseManager.publish(taskId, "fusion", fusionResult);
      } catch { console.warn('[task] finalize fusion failed'); }
    }

    sseManager.publish(taskId, "complete", { taskId, totalLatencyMs: Date.now() - task.startTime });
    sseManager.complete(taskId);
  }
}

// 全局单例 — 使用 globalThis 防止 Next.js HMR 重置
const globalForTask = globalThis as unknown as { __taskManager?: TaskManager };
export const taskManager: TaskManager =
  globalForTask.__taskManager ?? (globalForTask.__taskManager = new TaskManager());
