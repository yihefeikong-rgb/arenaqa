// 免费模型 Provider 注册
// 使用 OpenAICompatProvider 包装本地 Docker 免费 API

import { OpenAICompatProvider } from "./openai-compat";
import { FREE_MODELS } from "@/config/freeModels";

/** 注册所有免费模型到 Provider 注册中心 */
export function registerFreeProviders(
  register: (name: string, provider: unknown) => void
): void {
  FREE_MODELS.forEach((m) => {
    const envKey = `FREE_${m.id.toUpperCase().replace(/-/g, "_")}_TOKEN`;
    const token = process.env[envKey];

    if (!token) return; // 未配置则跳过

    register(m.id, new OpenAICompatProvider({
      name: m.id,
      apiBase: `http://localhost:${m.port}/v1`,
      apiKey: token,
      modelId: m.modelId,
    }));
  });
}
