// ============================================================
// Anthropic (Claude) Provider
// ============================================================

import type { LanguageModelV1 } from 'ai';
import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { BaseProvider } from './base';

interface AnthropicConfig {
  apiKey: string;
  modelId?: string;
}

export class AnthropicProvider extends BaseProvider {
  name = 'claude';
  private model: LanguageModelV1;

  constructor(config: AnthropicConfig) {
    super();
    const client = createAnthropic({ apiKey: config.apiKey });
    this.model = client(config.modelId ?? 'claude-sonnet-4-20250514') as unknown as LanguageModelV1;
  }

  getModel(): LanguageModelV1 {
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
