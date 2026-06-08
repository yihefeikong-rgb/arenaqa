// ============================================================
// Playwright Provider — 网页自动化（预留）
// 用于从 GPT-4、Claude Opus 等网页版抓取回答
// ============================================================

import { BaseProvider } from './base';
import type { LanguageModelV1 } from 'ai';

interface PlaywrightConfig {
  name: string;
  url: string;
  cookiePath?: string;
}

export class PlaywrightProvider extends BaseProvider {
  name: string;
  private url: string;
  private cookiePath: string;

  constructor(config: PlaywrightConfig) {
    super();
    this.name = config.name;
    this.url = config.url;
    this.cookiePath = config.cookiePath ?? './cookies.json';
  }

  getModel(): LanguageModelV1 {
    throw new Error('PlaywrightProvider does not use LanguageModelV1');
  }

  async *stream(_prompt: string, _signal?: AbortSignal): AsyncIterable<string> {
    // TODO: 实现 Playwright 浏览器自动化
    // 1. 启动浏览器
    // 2. 注入 Cookie 保持登录态
    // 3. 导航到对话页面
    // 4. 输入问题
    // 5. 等待回答生成
    // 6. 逐段抓取 DOM 并 yield
    yield '[Playwright Provider] 尚未实现 — 请在 MVP 版本后配置';
  }
}
