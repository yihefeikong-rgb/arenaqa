// NVIDIA NIM 模型定义
// 从 NIM API 查询到的可用模型列表
// 快速 / 小参数模型
export const NIM_SMALL_MODELS = [
  { id: "nim-deepseek-v4-flash", name: "DeepSeek V4 Flash", desc: "DeepSeek 快速推理 ✅" },
  { id: "nim-qwen3-next", name: "Qwen3 Next 80B", desc: "阿里千问 轻量 ✅" },
  { id: "nim-step-3.5-flash", name: "Step 3.5 Flash", desc: "阶跃星辰 快速" },
  { id: "nim-step-3.7-flash", name: "Step 3.7 Flash", desc: "阶跃星辰 新版" },
  { id: "nim-gemma-4", name: "Gemma 4 31B", desc: "Google 轻量" },
  { id: "nim-llama-3.1-8b", name: "Llama 3.1 8B", desc: "Meta 轻量" },
  { id: "nim-nemotron-mini", name: "Nemotron Mini 4B", desc: "NVIDIA 微模型" },
  { id: "nim-mistral-nemotron", name: "Mistral Nemotron", desc: "Mistral 轻量" },
  { id: "nim-phi-4-mini", name: "Phi-4 Mini", desc: "Microsoft 轻量" },
  { id: "nim-mistral-small-4", name: "Mistral Small 4", desc: "Mistral 快速" },
];

// 大参数模型
export const NIM_LARGE_MODELS = [
  { id: "nim-deepseek-v4-pro", name: "DeepSeek V4 Pro", desc: "DeepSeek 旗舰 ✅" },
  { id: "nim-llama-4", name: "Llama 4 Maverick", desc: "Meta 旗舰 ✅" },
  { id: "nim-llama-3.3-70b", name: "Llama 3.3 70B", desc: "Meta 大模型" },
  { id: "nim-mistral-large3", name: "Mistral Large 3", desc: "Mistral 旗舰" },
  { id: "nim-minimax-m2.7", name: "MiniMax M2.7", desc: "MiniMax" },
  { id: "nim-qwen3-coder-480b", name: "Qwen3 Coder 480B", desc: "阿里千问 代码旗舰" },
  { id: "nim-nemotron-ultra-253b", name: "Nemotron Ultra 253B", desc: "NVIDIA 旗舰" },
  { id: "nim-mistral-medium-3.5", name: "Mistral Medium 3.5", desc: "Mistral 中大型" },
  { id: "nim-qwen3.5-122b", name: "Qwen3.5 122B", desc: "阿里千问 旗舰" },
  { id: "nim-yi-large", name: "Yi Large", desc: "零一万物" },
  { id: "nim-glm-5.1", name: "GLM 5.1", desc: "智谱" },
  { id: "nim-kimi-k2.6", name: "Kimi K2.6", desc: "月之暗面" },
];

export const ALL_NIM_MODELS = [...NIM_SMALL_MODELS, ...NIM_LARGE_MODELS];

const LS_KEY = "arenaqa-nim-enabled";

// 获取已启用的 NIM 模型 ID 列表，默认全部启用
export function getEnabledNimModels(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return ALL_NIM_MODELS.map((m) => m.id);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return ALL_NIM_MODELS.map((m) => m.id);
  } catch {
    return ALL_NIM_MODELS.map((m) => m.id);
  }
}

export function saveEnabledNimModels(ids: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids));
}
