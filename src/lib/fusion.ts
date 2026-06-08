// ============================================================
// 融合引擎 — 纠错 + 综合答案生成
// TODO: Phase 2 实现
// ============================================================

import type { FusionEvent, Divergence } from '@/types';

export async function runFusion(
  _taskId: string,
  _prompt: string,
  _answers: Array<{ model: string; content: string }>
): Promise<FusionEvent> {
  // 步骤：
  // 1. 收集所有回答
  // 2. 调用裁判模型做融合
  // 3. 提取共识点、分歧点
  // 4. 生成综合答案
  // 5. 返回 FusionEvent

  return {
    consensus: ['融合引擎尚未实现'],
    divergences: [],
    synthesized: '# 综合答案\n\n融合生成功能尚未实现，将在 Phase 2 完成。',
  };
}

/**
 * 融合 prompt 模板
 */
export function buildFusionPrompt(prompt: string, answers: Array<{ model: string; content: string }>): string {
  return `你是一个 AI 回答整合专家。同一个问题有多个 AI 模型给出了回答。

## 用户问题
${prompt}

## 模型回答
${answers.map((a) => `### ${a.model}\n${a.content}`).join('\n\n')}

## 任务
第一步：提取共识 — 列出所有回答中都达成一致的要点
第二步：标注分歧 — 列出各模型回答存在明显分歧的观点
第三步：生成综合答案 — 基于以上分析，生成一份完整、好读的综合答案。共识部分直接纳入，分歧部分明确标注。

## 输出格式
{
  "consensus": ["共识点1", "共识点2"],
  "divergences": [{"topic": "分歧主题", "positions": {"模型A": "...", "模型B": "..."}}],
  "synthesized": "综合答案全文（Markdown 格式）"
}`;
}
