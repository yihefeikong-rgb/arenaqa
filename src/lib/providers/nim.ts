// ============================================================
// NVIDIA NIM Provider
// 使用原生 fetch 直连 NIM API
// 部分模型（如 Kimi）流式格式不标准，回退为非流式请求
// ============================================================

import { BaseProvider, normalizeInput } from './base';
import type { ChatMessage } from '@/types';

const NIM_CHAT_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

interface NIMConfig {
  name: string;
  apiKey: string;
  modelId: string;
  /** 对已知流式有问题的模型设为 false */
  streaming?: boolean;
}

export class NimProvider extends BaseProvider {
  name: string;
  private apiKey: string;
  private modelId: string;
  private streaming: boolean;

  constructor(config: NIMConfig) {
    super();
    this.name = config.name;
    this.apiKey = config.apiKey;
    this.modelId = config.modelId;
    this.streaming = config.streaming ?? true;
  }

  async *stream(input: string | ChatMessage[], signal?: AbortSignal): AsyncIterable<string> {
    const messages = normalizeInput(input);
    if (!this.streaming) {
      // 非流式：一次性获取完整结果
      const text = await this.nonStreamRequest(messages, signal);
      yield text;
      return;
    }

    // 流式：手动解析 SSE
    yield* this.streamRequest(messages, signal);
  }

  /** 非流式请求（一次性返回完整内容） */
  private async nonStreamRequest(messages: ChatMessage[], signal?: AbortSignal): Promise<string> {
    const res = await fetch(NIM_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelId,
        messages,
        max_tokens: 4096,
        temperature: 0.7,
        stream: false,
      }),
      signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`NIM API ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /** 流式请求（手动解析 SSE） */
  private async *streamRequest(messages: ChatMessage[], signal?: AbortSignal): AsyncIterable<string> {
    const res = await fetch(NIM_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelId,
        messages,
        max_tokens: 4096,
        temperature: 0.7,
        stream: true,
      }),
      signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`NIM API ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('NIM API response body is empty');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();

          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const choices = parsed.choices;
            if (!choices || choices.length === 0) continue;

            const delta = choices[0]?.delta;
            const content = delta?.content;
            if (content) yield content;
          } catch {
            console.warn(`[NimProvider] parse error for line: ${data.slice(0, 80)}`);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
