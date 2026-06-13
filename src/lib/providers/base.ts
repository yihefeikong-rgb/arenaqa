// ============================================================
// Base Provider — AI 模型接入抽象层
// ============================================================

import type { LanguageModel } from 'ai';
import type { ChatMessage } from '@/types';

/** 归一化输入：string → ChatMessage[] */
export function normalizeInput(input: string | ChatMessage[]): ChatMessage[] {
  if (typeof input === 'string') {
    return [{ role: 'user', content: input }];
  }
  return input;
}

export abstract class BaseProvider {
  abstract name: string;
  abstract stream(input: string | ChatMessage[], signal?: AbortSignal): AsyncIterable<string>;

  /** 可选：获取底层 LanguageModel 实例。部分 Provider（如 Nim）使用原生 fetch 不适用此方法 */
  getModel(): LanguageModel {
    throw new Error(`${this.constructor.name} does not support getModel() — use stream() directly`);
  }
}
