"use client";

import { useChatStore } from "@/stores/chat-store";

const MODEL_META: Record<string, { name: string; icon: string; desc: string }> = {
  deepseek: { name: "DeepSeek V3", icon: "D", desc: "性价比极高" },
  qwen: { name: "通义千问", icon: "Q", desc: "阿里百炼 API" },
  claude: { name: "Claude", icon: "C", desc: "Anthropic" },
  gemini: { name: "Gemini", icon: "G", desc: "Google" },
};

const MODEL_GRADIENT: Record<string, string> = {
  deepseek: "from-blue-500 to-cyan-500",
  qwen: "from-violet-500 to-pink-500",
  claude: "from-amber-500 to-orange-500",
  gemini: "from-emerald-500 to-teal-500",
};

interface Props {
  model: string;
  enabled?: boolean;
}

export function ModelCard({ model, enabled = true }: Props) {
  const selectedModels = useChatStore((s) => s.selectedModels);
  const selectModel = useChatStore((s) => s.selectModel);
  const deselectModel = useChatStore((s) => s.deselectModel);

  const meta = MODEL_META[model];
  const isSelected = selectedModels.includes(model);
  const isFull = selectedModels.length >= 4;
  const clickable = enabled && (isSelected || !isFull);

  if (!meta) return null;

  const handleClick = () => {
    if (!clickable) return;
    if (isSelected) {
      deselectModel(model);
    } else {
      selectModel(model);
    }
  };

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={handleClick}
      className={`
        relative border-2 rounded-xl p-3.5 transition-all duration-200 text-left w-full
        ${isSelected
          ? "border-indigo-400 bg-indigo-50/80 shadow-sm"
          : "border-gray-200 hover:border-indigo-200 hover:-translate-y-0.5 hover:shadow-sm"
        }
        ${!clickable ? "opacity-40 cursor-not-allowed hover:translate-y-0 hover:shadow-none" : "cursor-pointer"}
      `}
    >
      {isSelected && (
        <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br ${MODEL_GRADIENT[model]} text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm z-10`}>
          &#10003;
        </div>
      )}

      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${MODEL_GRADIENT[model]} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
          {meta.icon}
        </div>
        <span className="font-semibold text-[13px] text-gray-900">{meta.name}</span>
      </div>

      <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold mb-1 ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
        {enabled ? "已配置" : "未配置"}
      </span>

      <div className="text-[11px] text-gray-500 leading-tight">{meta.desc}</div>
    </button>
  );
}
