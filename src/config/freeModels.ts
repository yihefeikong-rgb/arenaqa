// 免费模型配置（通过 Docker 本地部署的 LLM-Red-Team 免费 API）
// Token 通过网页 Cookie 获取，仅供学习研究使用

export interface FreeModel {
  id: string;
  name: string;
  icon: string;
  description: string;
  tags: string[];
  port: number;
  modelId: string;
}

export const FREE_MODELS: FreeModel[] = [
  {
    id: "kimi-free",
    name: "Kimi (月之暗面)",
    icon: "🌙",
    description: "200K 超长上下文，联网搜索",
    tags: ["长文本", "联网"],
    port: 8001,
    modelId: "moonshot-v1",
  },
  {
    id: "qwen-free",
    name: "通义千问",
    icon: "🔷",
    description: "全能型，AI 绘图支持",
    tags: ["全能", "绘图"],
    port: 8002,
    modelId: "qwen-turbo",
  },
  {
    id: "deepseek-free",
    name: "DeepSeek (网页版)",
    icon: "🐋",
    description: "推理/代码能力突出",
    tags: ["推理", "代码"],
    port: 8003,
    modelId: "deepseek-chat",
  },
  {
    id: "doubao-free",
    name: "豆包",
    icon: "🟢",
    description: "多模态，超强联网搜索",
    tags: ["多模态", "联网"],
    port: 8004,
    modelId: "doubao-1.5-pro",
  },
  {
    id: "glm-free",
    name: "智谱清言",
    icon: "🧠",
    description: "中文优化，智能体支持",
    tags: ["中文", "Agent"],
    port: 8005,
    modelId: "glm-4",
  },
  {
    id: "spark-free",
    name: "讯飞星火",
    icon: "⚡",
    description: "语音交互，办公场景",
    tags: ["语音", "办公"],
    port: 8006,
    modelId: "spark-lite",
  },
  {
    id: "metaso-free",
    name: "秘塔搜索",
    icon: "🔍",
    description: "超强检索，学术研究",
    tags: ["搜索", "研究"],
    port: 8007,
    modelId: "metaso",
  },
];
