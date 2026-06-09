// ============================================================
// Base Provider — AI 模型接入抽象层
// ============================================================

import type { LanguageModel } from 'ai';

export abstract class BaseProvider {
  abstract name: string;
  abstract getModel(): LanguageModel;
  abstract stream(prompt: string, signal?: AbortSignal): AsyncIterable<string>;
}
