// ============================================================
// OpenAI-compatible Provider
// 支持 DeepSeek、通义千问、智谱、Kimi 等
// ============================================================

import type { LanguageModel } from 'ai';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { BaseProvider } from './base';

interface OpenAICompatConfig {
  name: string;
  apiBase: string;
  apiKey: string;
  modelId: string;
}

export class OpenAICompatProvider extends BaseProvider {
  name: string;
  private model: LanguageModel;

  constructor(config: OpenAICompatConfig) {
    super();
    this.name = config.name;
    const client = createOpenAI({
      baseURL: config.apiBase,
      apiKey: config.apiKey,
    });
    this.model = client.chat(config.modelId) as LanguageModel;
  }

  getModel(): LanguageModel {
    return this.model;
  }

  async *stream(prompt: string, signal?: AbortSignal): AsyncIterable<string> {
    const result = streamText({
      model: this.model,
      prompt,
      abortSignal: signal,
    });

    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }
}
