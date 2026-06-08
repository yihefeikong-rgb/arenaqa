// ============================================================
// Google Gemini Provider
// ============================================================

import type { LanguageModelV1 } from 'ai';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { BaseProvider } from './base';

interface GoogleConfig {
  apiKey: string;
  modelId?: string;
}

export class GoogleProvider extends BaseProvider {
  name = 'gemini';
  private model: LanguageModelV1;

  constructor(config: GoogleConfig) {
    super();
    const client = createGoogleGenerativeAI({ apiKey: config.apiKey });
    this.model = client(config.modelId ?? 'gemini-2.5-pro-exp-03-25') as unknown as LanguageModelV1;
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
