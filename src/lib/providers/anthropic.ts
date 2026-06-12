// ============================================================
// Anthropic (Claude) Provider
// ============================================================

import type { LanguageModel } from 'ai';
import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { BaseProvider } from './base';

interface AnthropicConfig {
  apiKey: string;
  modelId?: string;
}

export class AnthropicProvider extends BaseProvider {
  name = 'claude';
  private model: LanguageModel;

  constructor(config: AnthropicConfig) {
    super();
    const client = createAnthropic({ apiKey: config.apiKey });
    this.model = client(config.modelId ?? 'claude-sonnet-4-20250514') as LanguageModel;
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
