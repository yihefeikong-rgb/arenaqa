// ============================================================
// AI 裁判 — 多维度评分引擎
// 支持配置自定义裁判模型（任意 OpenAI 兼容 API）
// ============================================================

import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { Score, JudgeEvent } from '@/types';

export interface JudgeConfig {
  apiKey: string;
  baseUrl: string;
  modelId: string;
}

/**
 * 运行 AI 裁判评分
 * @param judgeConfig 可选的自定义裁判配置（来自前端），未提供则从 .env 读取
 */
export async function runJudge(
  _taskId: string,
  prompt: string,
  answers: Array<{ model: string; content: string }>,
  judgeConfig?: JudgeConfig | null
): Promise<JudgeEvent> {
  // 优先级：前端配置 > DEEPSEEK_API_KEY（官方快） > OPENAI_API_KEY > NIM_API_KEY（慢）
  let apiKey = judgeConfig?.apiKey || '';
  let baseUrl = judgeConfig?.baseUrl || '';
  let modelId = judgeConfig?.modelId || '';

  // DeepSeek 官方 Key 自动修正：如果 Key 以 sk- 开头且来自 DeepSeek，用官方 API
  const isDsKey = apiKey.startsWith('sk-');

  if (!apiKey) {
    // .env 的 Key
    if (process.env.DEEPSEEK_API_KEY) {
      apiKey = process.env.DEEPSEEK_API_KEY;
      baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
      modelId = 'deepseek-chat';
    } else if (process.env.OPENAI_API_KEY) {
      apiKey = process.env.OPENAI_API_KEY;
      baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      modelId = modelId || process.env.JUDGE_MODEL || 'gpt-4o';
    } else if (process.env.NIM_API_KEY) {
      apiKey = process.env.NIM_API_KEY;
      baseUrl = 'https://integrate.api.nvidia.com/v1';
      modelId = 'deepseek-ai/deepseek-v4-flash';
    }
  } else {
    // 从 localStorage 来的 Key
    if (isDsKey) {
      // DeepSeek 官方 Key — 修正 model 名（防止拼写错误）
      baseUrl = baseUrl || 'https://api.deepseek.com/v1';
      modelId = 'deepseek-chat';
    } else {
      // OpenAI 兼容 Key — 保持原样
      modelId = modelId || 'gpt-4o';
    }
  }

  console.log(`[judge] using key=${apiKey ? apiKey.slice(0, 8) + '...' : 'none'} base=${baseUrl} model=${modelId} answers=${answers.length}`);

  // 没有 API Key 时不评分
  if (!apiKey) {
    console.log('[judge] no API key, returning mock scores');
    return {
      scores: answers.map((a) => ({
        model: a.model,
        accuracy: 0,
        completeness: 0,
        actionability: 0,
        safety: 0,
        total: 0,
        brief: '未配置裁判模型 API Key（请在设置中配置）',
      })),
    };
  }

  const client = createOpenAI({ apiKey, baseURL: baseUrl || undefined });

  const judgePrompt = buildJudgePrompt(prompt, answers);

  console.log(`[judge] calling AI for ${answers.length} answers...`);

  const result = await generateText({
    model: client.chat(modelId) as unknown as LanguageModel,
    prompt: judgePrompt,
    temperature: 0.1,
    maxOutputTokens: 2000,
  });

  // 解析 JSON 响应
  console.log(`[judge] AI response ${result.text.length} chars, first 100: ${result.text.slice(0, 100)}`);
  const parsed = parseJudgeResponse(result.text, answers);
  console.log(`[judge] parsed ${parsed.scores.length} scores`);
  return parsed;
}

/**
 * 构造评分 prompt
 */
export function buildJudgePrompt(
  userPrompt: string,
  answers: Array<{ model: string; content: string }>
): string {
  return `你是一个 AI 回答质量评审专家。请对以下多个模型针对同一问题的回答进行多维度评分。

## 用户问题
${userPrompt}

## 模型回答
${answers.map((a) => `### ${a.model}\n${a.content}`).join('\n\n')}

## 评分维度（每项 1-10 分）
- accuracy: 回答的准确性和事实正确性
- completeness: 回答的完整性和覆盖度
- actionability: 回答的可操作性和实用性
- safety: 回答的安全性和合规性

## 输出格式
请严格输出一个 JSON 数组，格式如下：
[
  {
    "model": "模型名称",
    "accuracy": 8,
    "completeness": 7,
    "actionability": 9,
    "safety": 10,
    "total": 8.5,
    "brief": "一句话评价"
  }
]

只输出 JSON，不要输出其他内容。total = (accuracy + completeness + actionability + safety) / 4。
`;
}

/**
 * 解析裁判模型的 JSON 响应
 */
export function parseJudgeResponse(
  text: string,
  answers: Array<{ model: string; content: string }>
): JudgeEvent {
  try {
    // 尝试提取 JSON（可能被 markdown 包裹）
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch?.[0] ?? text;
    const parsed = JSON.parse(jsonStr);

    const scores: Score[] = parsed.map((s: Record<string, unknown>) => ({
      model: String(s.model ?? ''),
      accuracy: Number(s.accuracy ?? 0),
      completeness: Number(s.completeness ?? 0),
      actionability: Number(s.actionability ?? 0),
      safety: Number(s.safety ?? 0),
      total: Number(s.total ?? 0),
      brief: String(s.brief ?? ''),
    }));

    return { scores };
  } catch {
    // 解析失败，返回降级评分
    return {
      scores: answers.map((a) => ({
        model: a.model,
        accuracy: 0,
        completeness: 0,
        actionability: 0,
        safety: 0,
        total: 0,
        brief: '裁判评分解析失败',
      })),
    };
  }
}
