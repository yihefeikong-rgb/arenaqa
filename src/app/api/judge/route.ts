// POST /api/judge — 独立评分（历史对话重新评分）
import { NextRequest, NextResponse } from 'next/server';
import { runJudge } from '@/lib/judge';
import { runFusion } from '@/lib/fusion';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, answers, apiKey, baseUrl, modelId } = body as {
      prompt: string;
      answers: Array<{ model: string; content: string }>;
      apiKey?: string;
      baseUrl?: string;
      modelId?: string;
    };

    if (!prompt || !answers?.length) {
      return NextResponse.json({ error: '缺少 prompt 或 answers' }, { status: 400 });
    }

    const judgeConfig = apiKey ? { apiKey, baseUrl: baseUrl || '', modelId: modelId || '' } : undefined;

    const judgeResult = await runJudge('history', prompt, answers, judgeConfig);

    // 融合单独 try-catch，失败也不影响评分结果
    let fusionResult = null;
    try {
      // 让 fusion 也使用 DeepSeek（如果传了 Key），避免走慢的 NIM
      if (judgeConfig) {
        fusionResult = await runFusion('history', prompt, answers, judgeConfig.apiKey, judgeConfig.baseUrl);
      } else {
        fusionResult = await runFusion('history', prompt, answers);
      }
    } catch (e) {
      console.error('[judge] fusion failed:', e);
    }

    return NextResponse.json({
      scores: judgeResult.scores,
      fusion: fusionResult,
    });
  } catch (e) {
    console.error('[judge] error:', e);
    return NextResponse.json({ error: '评分失败' }, { status: 500 });
  }
}
