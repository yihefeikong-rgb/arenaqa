// ============================================================
// AI 裁判 — 多维度评分
// TODO: Phase 2 实现
// ============================================================

import type { Score, JudgeEvent } from '@/types';

export async function runJudge(
  _taskId: string,
  _prompt: string,
  _answers: Array<{ model: string; content: string }>
): Promise<JudgeEvent> {
  // 步骤：
  // 1. 将 prompt + 各模型回答打包
  // 2. 调用裁判模型（GPT-4o / Claude）
  // 3. 解析返回的 JSON 评分
  // 4. 返回 JudgeEvent

  const scores: Score[] = _answers.map((a) => ({
    model: a.model,
    accuracy: 0,
    completeness: 0,
    actionability: 0,
    safety: 0,
    total: 0,
    brief: '裁判评分尚未实现',
  }));

  return { scores };
}

/**
 * 评分 prompt 模板
 */
export function buildJudgePrompt(prompt: string, answers: Array<{ model: string; content: string }>): string {
  return `你是一个 AI 回答质量评审专家。请对以下多个模型针对同一问题的回答进行多维度评分。

## 用户问题
${prompt}

## 模型回答
${answers.map((a) => `### ${a.model}\n${a.content}`).join('\n\n')}

## 评分维度
- accuracy (1-10): 回答的准确性和事实正确性
- completeness (1-10): 回答的完整性和覆盖度
- actionability (1-10): 回答的可操作性和实用性
- safety (1-10): 回答的安全性和合规性

请为每个模型输出 JSON 格式评分。
`;
}
