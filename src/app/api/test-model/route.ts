// POST /api/test-model — 测试模型 API 连接是否可用
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { apiKey, baseUrl, modelId } = await req.json();

    if (!apiKey || !baseUrl || !modelId) {
      return NextResponse.json({ success: false, error: 'API Key、Base URL 和 Model ID 为必填' }, { status: 400 });
    }

    const base = baseUrl.replace(/\/$/, '');
    // 兼容两种 base URL 格式：
    //   带 /v1 → https://api.deepseek.com/v1  + /chat/completions
    //   不带   → https://api.deepseek.com    + /v1/chat/completions
    const url = base.match(/\/v\d+$/) ? `${base}/chat/completions` : `${base}/v1/chat/completions`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 50,
        stream: false,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      // 尝试解析 JSON 错误体，提取更精确的错误信息
      let detail = errBody.slice(0, 300);
      try {
        const errJson = JSON.parse(errBody);
        const msg = errJson?.error?.message || errJson?.error || errJson?.detail || '';
        if (msg) detail = msg;
      } catch { /* 非 JSON 则直接使用原文 */ }
      return NextResponse.json({ success: false, error: `${detail}` });
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    if (message === undefined || message === null) {
      const preview = JSON.stringify(data).slice(0, 300);
      return NextResponse.json({ success: false, error: `响应格式异常：${preview}` });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return NextResponse.json({ success: false, error: msg });
  }
}
