// ============================================================
// Base Provider — AI 模型接入抽象层
// ============================================================

import type { LanguageModel } from 'ai';

export abstract class BaseProvider {
  abstract name: string;
  abstract stream(prompt: string, signal?: AbortSignal): AsyncIterable<string>;

  /** 可选：获取底层 LanguageModel 实例。部分 Provider（如 Nim）使用原生 fetch 不适用此方法 */
  getModel(): LanguageModel {
    throw new Error(`${this.constructor.name} does not support getModel() — use stream() directly`);
  }
}
