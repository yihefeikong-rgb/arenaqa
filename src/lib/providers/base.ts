// ============================================================
// Base Provider — AI 模型接入抽象层
// ============================================================

import type { LanguageModelV1 } from 'ai';

export abstract class BaseProvider {
  abstract name: string;
  abstract getModel(): LanguageModelV1;
  abstract stream(prompt: string, signal?: AbortSignal): AsyncIterable<string>;
}
