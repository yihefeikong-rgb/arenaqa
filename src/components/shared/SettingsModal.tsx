"use client";

import { useState, useEffect } from "react";

const API_KEY_FIELDS = [
  { key: "DEEPSEEK_API_KEY", label: "DeepSeek API Key", hint: "从 platform.deepseek.com 获取" },
  { key: "QWEN_API_KEY", label: "通义千问 API Key", hint: "从 阿里云百炼 获取" },
  { key: "ANTHROPIC_API_KEY", label: "Anthropic API Key", hint: "从 console.anthropic.com 获取" },
  { key: "GEMINI_API_KEY", label: "Gemini API Key", hint: "从 aistudio.google.com 获取" },
  { key: "OPENAI_API_KEY", label: "OpenAI API Key (裁判评分)", hint: "从 platform.openai.com 获取，用于 AI 裁判评分和融合" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const stored: Record<string, string> = {};
    API_KEY_FIELDS.forEach((f) => {
      stored[f.key] = localStorage.getItem(`arenaqa-${f.key}`) || "";
    });
    setKeys(stored);
    setSaved(false);
  }, [open]);

  const handleSave = () => {
    API_KEY_FIELDS.forEach((f) => {
      if (keys[f.key]) {
        localStorage.setItem(`arenaqa-${f.key}`, keys[f.key]);
      } else {
        localStorage.removeItem(`arenaqa-${f.key}`);
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // 通知页面刷新 key 配置
    window.dispatchEvent(new Event("arenaqa-keys-updated"));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/30" />

      {/* 面板 */}
      <div
        className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">API Key 设置</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            API Key 保存在浏览器本地存储中，不会上传到服务器。配置后需要重启应用才能生效。
          </p>

          {API_KEY_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{field.label}</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                placeholder={field.hint}
                value={keys[field.key] || ""}
                onChange={(e) => setKeys((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        {/* 底部 */}
        <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-400">仅保存在浏览器本地</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">取消</button>
            <button onClick={handleSave} className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${saved ? "bg-emerald-500" : "bg-indigo-500 hover:bg-indigo-600"}`}>
              {saved ? "已保存" : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
