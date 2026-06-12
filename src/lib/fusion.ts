// ============================================================
// 融合引擎 — 多模型回答综合 + 分歧标注
// 调用裁判模型（GPT-4o）提取共识、标注分歧、生成综合答案
// ============================================================

import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { FusionEvent, Divergence } from '@/types';

/**
 * 运行 AI 融合
 * 向裁判模型发送 prompt + 所有回答，生成融合答案
 */
export async function runFusion(
  _taskId: string,
  prompt: string,
  answers: Array<{ model: string; content: string }>,
  apiKeyOverride?: string,
  baseUrlOverride?: string,
): Promise<FusionEvent> {
  // API Key 优先级：参数传入 > DEEPSEEK_API_KEY > OPENAI_API_KEY > NIM_API_KEY
  let apiKey = apiKeyOverride || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  let baseUrl = apiKeyOverride
    ? (baseUrlOverride || 'https://api.deepseek.com/v1')
    : (process.env.DEEPSEEK_API_KEY
      ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1')
      : process.env.OPENAI_BASE_URL);
  let fusionModel = apiKeyOverride ? 'deepseek-chat'
    : process.env.DEEPSEEK_API_KEY ? 'deepseek-chat'
    : (process.env.JUDGE_MODEL ?? 'gpt-4o');

  if (!apiKey && process.env.NIM_API_KEY) {
    apiKey = process.env.NIM_API_KEY;
    baseUrl = 'https://integrate.api.nvidia.com/v1';
    fusionModel = 'deepseek-ai/deepseek-v4-flash';
  }

  if (!apiKey) {
    return {
      consensus: ['融合引擎需要配置 API Key（OPENAI_API_KEY 或 NIM_API_KEY）'],
      divergences: [],
      synthesized: answers.map((a) => `## ${a.model}\n${a.content}`).join('\n\n---\n\n'),
    };
  }

  if (answers.length <= 1) {
    return {
      consensus: ['仅有一个模型回答，无需融合'],
      divergences: [],
      synthesized: answers[0]?.content ?? '无回答',
    };
  }

  try {
    const client = createOpenAI({ apiKey, baseURL: baseUrl || undefined });

    const fusionPrompt = buildFusionPrompt(prompt, answers);

    const result = await generateText({
      model: client.chat(fusionModel) as LanguageModel,
      prompt: fusionPrompt,
      temperature: 0.2,
      maxOutputTokens: 4096,
    });

    console.log(`[fusion] API returned ${result.text.length} chars, model=${fusionModel}`);
    return parseFusionResponse(result.text, answers);
  } catch (e) {
    console.warn('[fusion] runFusion failed', e);
    // 融合失败，降级为简单拼接
    return {
      consensus: ['融合引擎调用失败'],
      divergences: [],
      synthesized: answers.map((a) => `## ${a.model}\n${a.content}`).join('\n\n---\n\n'),
    };
  }
}

/**
 * 构造融合 prompt
 */
export function buildFusionPrompt(
  userPrompt: string,
  answers: Array<{ model: string; content: string }>
): string {
  return `你是一个 AI 回答整合专家。同一个问题有多个 AI 模型给出了回答。

## 用户问题
${userPrompt}

## 模型回答
${answers.map((a) => `### ${a.model}\n${a.content}`).join('\n\n')}

## 任务
1. **提取共识**：列出所有回答中都达成一致的要点
2. **标注分歧**：列出各模型回答存在明显分歧的观点（如果存在的话）
3. **生成综合答案**：基于以上分析，生成一份完整、好读的综合答案。
   - 共识部分直接纳入
   - 分歧部分明确标注各个模型的不同立场
   - 严禁凭空添加任何原始回答中不存在的观点

## 输出格式
请严格输出 JSON，不要包含其他内容：
{
  "consensus": ["共识点1", "共识点2"],
  "divergences": [
    {
      "topic": "分歧主题",
      "positions": {
        "模型A": "其立场",
        "模型B": "其立场"
      }
    }
  ],
  "synthesized": "综合答案全文（Markdown 格式）"
}
`;
}

/**
 * 解析融合 JSON 响应
 */
export function parseFusionResponse(
  text: string,
  answers: Array<{ model: string; content: string }>
): FusionEvent {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch?.[0] ?? text;
    const parsed = JSON.parse(jsonStr);

    return {
      consensus: Array.isArray(parsed.consensus) ? parsed.consensus : ['未能提取共识'],
      divergences: Array.isArray(parsed.divergences)
        ? parsed.divergences.map((d: Record<string, unknown>) => ({
            topic: String(d.topic ?? ''),
            positions: Object.fromEntries(
              Object.entries(d.positions ?? {}).map(([k, v]) => [k, String(v)])
            ),
          }))
        : [],
      synthesized: String(parsed.synthesized ?? ''),
    };
  } catch (e) {
    console.warn('[fusion] parseFusionResponse failed', e);
    // 降级：简单拼接
    const divergences: Divergence[] = [];
    const shortContents = answers.slice(0, Math.min(answers.length, 3));

    return {
      consensus: ['融合解析失败，以下为原始回答'],
      divergences,
      synthesized: shortContents
        .map((a) => `## ${a.model}\n\n${a.content}`)
        .join('\n\n---\n\n'),
    };
  }
}
