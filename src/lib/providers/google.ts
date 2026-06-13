// ============================================================
// Google Gemini Provider
// ============================================================

import type { LanguageModel } from 'ai';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { BaseProvider, normalizeInput } from './base';
import type { ChatMessage } from '@/types';

interface GoogleConfig {
  apiKey: string;
  modelId?: string;
}

export class GoogleProvider extends BaseProvider {
  name = 'gemini';
  private model: LanguageModel;

  constructor(config: GoogleConfig) {
    super();
    const client = createGoogleGenerativeAI({ apiKey: config.apiKey });
    this.model = client(config.modelId ?? 'gemini-2.5-pro-exp-03-25') as LanguageModel;
  }

  getModel(): LanguageModel {
    return this.model;
  }

  async *stream(input: string | ChatMessage[], signal?: AbortSignal): AsyncIterable<string> {
    const messages = normalizeInput(input);
    const result = streamText({
      model: this.model,
      messages,
      abortSignal: signal,
    });

    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }
}
