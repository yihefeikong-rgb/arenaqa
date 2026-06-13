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
import { prisma } from "./db";
import { generateSummary } from "./summarizer";
import type { ChatRequest, ChatMessage } from "@/types";

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

// --- P6 上下文策略 V2 常量 ---
const CONTEXT_WINDOW_SIZE = Number(process.env.CONTEXT_WINDOW_SIZE) || 3;
const MAX_CONTEXT_TOKENS = Number(process.env.MAX_CONTEXT_TOKENS) || 6000;
const FUSION_MAX_TOKENS = 2000;
const TOKEN_RATIO = 0.5; // 字符→token 估算系数

interface RunningTask {
  taskId: string;
  prompt: string;
  messages: ChatMessage[];
  conversationId?: string;
  round: number;
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

  /** 字符→token 估算（中英文混合场景，保守系数） */
  private estimateTokens(text: string): number {
    // 中文字符约占 1.8 token，英文约占 0.35 token，折中使用 0.5
    return Math.ceil(text.length * TOKEN_RATIO);
  }

  /** 截断单条 Fusion 文本到指定 token 预算 */
  private truncateFusion(text: string, maxTokens: number): string {
    const estimated = this.estimateTokens(text);
    if (estimated <= maxTokens) return text;
    const maxChars = Math.floor(maxTokens / TOKEN_RATIO);
    const truncated = text.slice(0, maxChars);
    // 尝试多个断点字符（中文句号、英文句号、感叹号、换行）
    const breakChars = ['。', '.', '！', '?', '\n\n', '\n'];
    for (const ch of breakChars) {
      const idx = truncated.lastIndexOf(ch);
      if (idx > maxChars * 0.5) {
        return truncated.slice(0, idx + 1) + '...(已截断)';
      }
    }
    return truncated + '...(已截断)';
  }

  /** 安全解析 Conversation.prompts JSON */
  private parsePrompts(json: string, fallbackPrompt: string): string[] {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return [fallbackPrompt];
    } catch {
      return [fallbackPrompt];
    }
  }

  /** 对消息数组应用 token 预算，从最旧轮次开始丢弃 */
  private applyTokenBudget(messages: ChatMessage[]): ChatMessage[] {
    const result = [...messages];
    // 记录 system 消息（摘要），不参与丢弃
    let systemMsg: ChatMessage | null = null;
    if (result.length > 0 && result[0].role === 'system') {
      systemMsg = result.shift()!;
    }

    while (result.length > 1 && this.estimateTokens(result.map(m => m.content).join('')) > MAX_CONTEXT_TOKENS) {
      // 丢弃最早的一对消息（user + assistant），保留最后一条（当前问题）
      if (result.length >= 3) {
        result.splice(0, 2);
      } else {
        break;
      }
    }

    // 将 system 消息放回开头
    if (systemMsg) {
      result.unshift(systemMsg);
    }
    return result;
  }

  /** 构建模型请求的消息数组 — P6 V2：最近 N 轮上下文 */
  private async buildMessages(
    conversationId: string | undefined,
    prompt: string,
    round: number | undefined
  ): Promise<ChatMessage[]> {
    // 第一轮：直接返回用户消息
    if (!conversationId || !round || round <= 1) {
      return [{ role: 'user', content: prompt }];
    }

    try {
      // 计算上下文窗口范围
      const windowSize = Math.min(round - 1, CONTEXT_WINDOW_SIZE);
      const startRound = round - windowSize;

      // 一次查询获取 Conversation 和所有相关 Fusion
      const [conv, fusions] = await Promise.all([
        prisma.conversation.findUnique({ where: { id: conversationId } }),
        prisma.fusion.findMany({
          where: {
            conversationId,
            round: { gte: startRound, lt: round },
          },
          orderBy: { round: 'asc' },
        }),
      ]);

      if (!conv) {
        console.warn(`[buildMessages] conversation ${conversationId} not found, falling back`);
        return [{ role: 'user', content: prompt }];
      }

      const prompts = this.parsePrompts(conv.prompts, conv.prompt);

      // 构建最近 N 轮的消息对（顺序：先 user 提问，再 assistant 回答）
      const messages: ChatMessage[] = [];

      for (let r = startRound; r < round; r++) {
        const roundPrompt = prompts[r - 1] ?? '';

        // 先 push 用户问题
        if (roundPrompt) {
          messages.push({ role: 'user', content: roundPrompt });
        }

        // 再 push assistant 消息（Fusion 摘要或兜底）
        const fusion = fusions.find((f) => f.round === r);
        if (fusion?.synthesized && fusion.synthesized.trim().length > 0) {
          const truncated = this.truncateFusion(fusion.synthesized, FUSION_MAX_TOKENS);
          messages.push({ role: 'assistant', content: `【第${r}轮摘要】\n${truncated}` });
        } else {
          messages.push({
            role: 'assistant',
            content: `【第${r}轮】该轮融合摘要未生成。`,
          });
        }
      }

      // 追加当前问题
      messages.push({ role: 'user', content: prompt });

      // 如果存在摘要，将其作为 system 消息放在最前面
      if (conv.summary && conv.summaryRound) {
        const summaryText = `以下是此前对话历史的摘要：\n\n${conv.summary}`;
        messages.unshift({ role: 'system', content: summaryText });
      }

      // 应用 token 预算截断
      const finalMessages = this.applyTokenBudget(messages);

      console.log(
        `[buildMessages] conv=${conversationId} round=${round} window=[${startRound}..${round - 1}] ` +
        `messages=${finalMessages.length} chars=${finalMessages.map(m => m.content.length).reduce((a, b) => a + b, 0)}`
      );

      return finalMessages;
    } catch (err) {
      console.error(`[buildMessages] error: ${err instanceof Error ? err.message : err}`);
      return [{ role: 'user', content: prompt }];
    }
  }

  async startTask(req: ChatRequest): Promise<string> {
    const taskId = `task_${randomUUID().slice(0, 8)}`;
    console.log(`[startTask] taskId=${taskId} models=${req.models.join(',')} providers=${this.providers.size}`);
    const startTime = Date.now();
    const currentRound = req.round ?? 1;

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

    // 构建消息数组（基于 conversationId + round 加载上下文）
    const messages = await this.buildMessages(req.conversationId, req.prompt, currentRound);

    const task: RunningTask = {
      taskId,
      prompt: req.prompt,
      messages,
      conversationId: req.conversationId,
      round: currentRound,
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

      // 用于存储本轮 Fusion 内容（供摘要使用）
      let lastFusionContent = '';

      try {
        const answersArr = req.models
          .filter((m) => task.completedModels.has(m))
          .map((m) => ({ model: m, content: task.answers.get(m) ?? "" }));

        console.log(`[task] running judge with ${answersArr.length} completed models`);
        const judgeResult = await withTimeout(
          runJudge(taskId, req.prompt, answersArr, this._judgeConfig, currentRound),
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
            runFusion(taskId, req.prompt, answersArr, fusionKey, fusionBase, currentRound),
            FUSION_TIMEOUT_MS,
            'Fusion'
          );
          console.log('[task] fusion done');
          sseManager.publish(taskId, "fusion", fusionResult);
          lastFusionContent = fusionResult.synthesized || '';
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
              runJudge(taskId, req.prompt, answersArr, null, currentRound), // null → NIM fallback
              JUDGE_TIMEOUT_MS,
              'Judge retry'
            );
            console.log(`[task] judge retry done, scores=${judgeResult.scores.length}`);
            sseManager.publish(taskId, "judge", judgeResult);

            try {
              const fusionKey = process.env.NIM_API_KEY || process.env.DEEPSEEK_API_KEY;
              const fusionResult = await withTimeout(
                runFusion(taskId, req.prompt, answersArr, fusionKey, undefined, currentRound),
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

      // P8: 异步生成摘要（不阻塞 complete，fire-and-forget）
      if (task.conversationId && task.round >= 3 && lastFusionContent) {
        const fc = lastFusionContent;
        this.backgroundSummarize(task, fc).catch((e) =>
          console.warn(`[task] backgroundSummarize error: ${e.message}`)
        );
      }
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

    // Gemini 不支持 system 角色：将 system 消息合并到第一个 user 消息
    let messagesForProvider = task.messages;
    if (modelName === 'gemini' && messagesForProvider.length > 0 && messagesForProvider[0].role === 'system') {
      const systemContent = messagesForProvider[0].content;
      const rest = messagesForProvider.slice(1);
      const firstUser = rest.find((m) => m.role === 'user');
      if (firstUser) {
        firstUser.content = `[系统上下文]\n${systemContent}\n\n[用户问题]\n${firstUser.content}`;
      }
      messagesForProvider = rest;
    }

    try {
      for await (const chunk of provider.stream(messagesForProvider, controller.signal)) {
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
        const judgeResult = await runJudge(taskId, task.prompt, completedArr, this._judgeConfig, task.round);
        sseManager.publish(taskId, "judge", judgeResult);
      } catch { console.warn('[task] finalize judge failed'); }

      try {
        const fusionResult = await runFusion(taskId, task.prompt, completedArr, undefined, undefined, task.round);
        sseManager.publish(taskId, "fusion", fusionResult);
      } catch { console.warn('[task] finalize fusion failed'); }
    }

    sseManager.publish(taskId, "complete", { taskId, totalLatencyMs: Date.now() - task.startTime });
    sseManager.complete(taskId);
  }

  /** P8: 后台生成累进摘要 */
  private async backgroundSummarize(task: RunningTask, fusionContent: string): Promise<void> {
    if (!task.conversationId || fusionContent.length < 200) return;

    try {
      // 获取已有的摘要信息
      const conv = await prisma.conversation.findUnique({
        where: { id: task.conversationId },
        select: { summary: true, summaryRound: true, prompts: true },
      });
      if (!conv) return;

      // 准备全量重生成所需的历史数据
      const allRounds: Array<{ round: number; prompt: string; fusion: string }> = [];
      if (task.round % 5 === 0) {
        const historyFusions = await prisma.fusion.findMany({
          where: { conversationId: task.conversationId },
          orderBy: { round: 'asc' },
        });
        const parsedPrompts: string[] = JSON.parse(conv.prompts || '[]');
        const fusionMap = new Map(historyFusions.map((f) => [f.round, f]));
        for (let r = 1; r <= task.round; r++) {
          const fusion = fusionMap.get(r);
          allRounds.push({
            round: r,
            prompt: parsedPrompts[r - 1] ?? '',
            fusion: fusion?.synthesized ?? '',
          });
        }
      }

      const summary = await generateSummary(
        conv.summary,
        task.round,
        task.prompt,
        fusionContent,
        allRounds.length > 0 ? allRounds : undefined,
        this._judgeConfig
      );

      if (summary) {
        await prisma.conversation.update({
          where: { id: task.conversationId },
          data: { summary, summaryRound: task.round },
        });
        console.log(`[summarizer] saved summary for ${task.conversationId} round ${task.round} (${summary.length} chars)`);
      }
    } catch (err) {
      console.warn(`[summarizer] background failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}

// 全局单例 — 使用 globalThis 防止 Next.js HMR 重置
const globalForTask = globalThis as unknown as { __taskManager?: TaskManager };
export const taskManager: TaskManager =
  globalForTask.__taskManager ?? (globalForTask.__taskManager = new TaskManager());
