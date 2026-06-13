// ============================================================
// 摘要生成引擎 — P8 Memory V3
// 在每轮对话完成后异步生成累进摘要
// ============================================================

import { generateText } from 'ai';
import { resolveModel, getLanguageModel } from './model-selector';
import type { JudgeConfig } from '@/types';

const SUMMARY_TIMEOUT_MS = Number(process.env.SUMMARY_TIMEOUT_MS) || 15_000;
const SUMMARY_FULL_REGEN_INTERVAL = Number(process.env.SUMMARY_FULL_REGEN_INTERVAL) || 5;

/**
 * 增量追加 prompt — 基于已有摘要 + 本轮新内容更新
 */
function buildIncrementalPrompt(
  existingSummary: string | null,
  round: number,
  prompt: string,
  fusionContent: string
): string {
  return `你是一个对话摘要助手。请根据已有的历史摘要和新增的对话内容，更新摘要。

## 已有摘要
${existingSummary || '（无，这是第一次生成摘要）'}

## 新增对话内容
**用户问题**：${prompt}
**AI 综合回答要点**：${fusionContent.slice(0, 2000)}

## 更新要求
1. 保留已有摘要中所有关键信息
2. 将新增内容的关键信息合并进来
3. 按照「问题→讨论→结论」的逻辑组织
4. 严格基于对话原文，不添加推测或编造
5. 控制在 800 tokens 以内
6. 使用中文

## 输出格式
直接输出更新后的摘要文本，不要加任何前缀或说明。`;
}

/**
 * 全量重生成 prompt — 基于所有历史轮次重新生成摘要
 */
function buildFullRegenPrompt(
  rounds: Array<{ round: number; prompt: string; fusion: string }>
): string {
  const history = rounds
    .map((r) => `## 第 ${r.round} 轮\n用户：${r.prompt}\nAI 回答：${r.fusion.slice(0, 1000)}`)
    .join('\n\n');

  return `你是一个对话摘要助手。请根据以下多轮对话的完整记录，生成一份摘要。

## 对话历史
${history}

## 要求
1. 捕捉对话的初始目标和演进脉络
2. 列出各阶段的关键结论和决策
3. 如有未解决的问题，明确标注
4. 严格基于对话原文，不添加推测或编造
5. 控制在 1200 tokens 以内
6. 使用中文

## 输出格式
直接输出摘要文本，不要加任何前缀或说明。`;
}

/**
 * 生成对话摘要
 * @param existingSummary 已有的摘要文本（null 表示首次）
 * @param round 当前轮次
 * @param prompt 当前轮用户问题
 * @param fusionContent 当前轮 Fusion 摘要
 * @param allRounds 所有历史轮次数据（用于全量重生成）
 * @param judgeConfig 可选的裁判模型配置
 * @returns 生成的摘要文本，失败时返回 null
 */
export async function generateSummary(
  existingSummary: string | null,
  round: number,
  prompt: string,
  fusionContent: string,
  allRounds?: Array<{ round: number; prompt: string; fusion: string }>,
  judgeConfig?: JudgeConfig | null
): Promise<string | null> {
  const model = resolveModel(judgeConfig);
  if (!model) return null;

  try {
    const isFullRegen = round % SUMMARY_FULL_REGEN_INTERVAL === 0;

    const summaryPrompt = isFullRegen && allRounds && allRounds.length > 0
      ? buildFullRegenPrompt(allRounds)
      : buildIncrementalPrompt(existingSummary, round, prompt, fusionContent);

    console.log(`[summarizer] mode=${isFullRegen ? 'full' : 'incremental'} round=${round} model=${model.modelId}`);

    const result = await generateText({
      model: getLanguageModel(model),
      prompt: summaryPrompt,
      temperature: 0.3,
      maxOutputTokens: 1500,
    });

    const text = result.text.trim();
    if (!text) return null;
    return text;
  } catch (err) {
    console.error(`[summarizer] error: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}
