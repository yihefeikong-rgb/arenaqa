"use client";

import { useState, useEffect } from "react";

interface CustomModel {
  id: string;
  name: string;
  apiBase: string;
  apiKey: string;
  modelId: string;
}

interface BuiltinModelConfig {
  id: string;
  name: string;
  storagePrefix: string;
  defaultBaseUrl: string;
  defaultModelId: string;
  keyHint: string;
}

const BUILTIN_MODELS: BuiltinModelConfig[] = [
  { id: "deepseek", name: "DeepSeek", storagePrefix: "DEEPSEEK", defaultBaseUrl: "https://api.deepseek.com", defaultModelId: "deepseek-chat", keyHint: "platform.deepseek.com" },
  { id: "qwen", name: "通义千问", storagePrefix: "QWEN", defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", defaultModelId: "qwen-plus", keyHint: "阿里云百炼" },
  { id: "claude", name: "Claude", storagePrefix: "ANTHROPIC", defaultBaseUrl: "", defaultModelId: "claude-sonnet-4-20250514", keyHint: "console.anthropic.com" },
  { id: "gemini", name: "Gemini", storagePrefix: "GEMINI", defaultBaseUrl: "", defaultModelId: "gemini-2.5-pro-preview-05-06", keyHint: "aistudio.google.com" },
];

function loadCustomModels(): CustomModel[] {
  try {
    const raw = localStorage.getItem("arenaqa-custom-models");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomModels(models: CustomModel[]) {
  localStorage.setItem("arenaqa-custom-models", JSON.stringify(models));
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>({});
  const [modelIds, setModelIds] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"keys" | "judge" | "custom" | "nvidia">("keys");

  // 内置 Key
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [editingModel, setEditingModel] = useState<CustomModel | null>(null);

  // 裁判模型配置
  const [judgeApiKey, setJudgeApiKey] = useState("");
  const [judgeBaseUrl, setJudgeBaseUrl] = useState("");
  const [judgeModelId, setJudgeModelId] = useState("");

  // NVIDIA NIM
  const [nimApiKey, setNimApiKey] = useState("");

  useEffect(() => {
    if (!open) return;
    const stored: Record<string, string> = {};
    const urls: Record<string, string> = {};
    const mids: Record<string, string> = {};
    BUILTIN_MODELS.forEach((m) => {
      stored[m.storagePrefix] = localStorage.getItem(`arenaqa-${m.storagePrefix}_API_KEY`) || "";
      urls[m.storagePrefix] = localStorage.getItem(`arenaqa-${m.storagePrefix}_BASE_URL`) || m.defaultBaseUrl;
      mids[m.storagePrefix] = localStorage.getItem(`arenaqa-${m.storagePrefix}_MODEL_ID`) || m.defaultModelId;
    });
    setKeys(stored);
    setBaseUrls(urls);
    setModelIds(mids);
    setCustomModels(loadCustomModels());
    setJudgeApiKey(localStorage.getItem("arenaqa-JUDGE_API_KEY") || "");
    setJudgeBaseUrl(localStorage.getItem("arenaqa-JUDGE_BASE_URL") || "");
    setJudgeModelId(localStorage.getItem("arenaqa-JUDGE_MODEL") || "gpt-4o");
    setNimApiKey(localStorage.getItem("arenaqa-NIM_API_KEY") || "");
    setSaved(false);
  }, [open]);

  const handleSaveKeys = () => {
    BUILTIN_MODELS.forEach((m) => {
      const prefix = m.storagePrefix;
      if (keys[prefix]) localStorage.setItem(`arenaqa-${prefix}_API_KEY`, keys[prefix]);
      else localStorage.removeItem(`arenaqa-${prefix}_API_KEY`);
      if (baseUrls[prefix] && baseUrls[prefix] !== m.defaultBaseUrl) localStorage.setItem(`arenaqa-${prefix}_BASE_URL`, baseUrls[prefix]);
      else localStorage.removeItem(`arenaqa-${prefix}_BASE_URL`);
      if (modelIds[prefix] && modelIds[prefix] !== m.defaultModelId) localStorage.setItem(`arenaqa-${prefix}_MODEL_ID`, modelIds[prefix]);
      else localStorage.removeItem(`arenaqa-${prefix}_MODEL_ID`);
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.dispatchEvent(new Event("arenaqa-keys-updated"));
  };

  const handleSaveJudge = () => {
    if (judgeApiKey) localStorage.setItem("arenaqa-JUDGE_API_KEY", judgeApiKey);
    else localStorage.removeItem("arenaqa-JUDGE_API_KEY");
    if (judgeBaseUrl) localStorage.setItem("arenaqa-JUDGE_BASE_URL", judgeBaseUrl);
    else localStorage.removeItem("arenaqa-JUDGE_BASE_URL");
    localStorage.setItem("arenaqa-JUDGE_MODEL", judgeModelId || "gpt-4o");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.dispatchEvent(new Event("arenaqa-keys-updated"));
  };

  const handleSaveNim = () => {
    if (nimApiKey) localStorage.setItem("arenaqa-NIM_API_KEY", nimApiKey);
    else localStorage.removeItem("arenaqa-NIM_API_KEY");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.dispatchEvent(new Event("arenaqa-keys-updated"));
  };

  const addCustomModel = () => {
    const m: CustomModel = { id: "", name: "", apiBase: "", apiKey: "", modelId: "" };
    setEditingModel(m);
  };

  const saveCustomModel = () => {
    if (!editingModel) return;
    if (!editingModel.name || !editingModel.apiBase || !editingModel.apiKey || !editingModel.modelId) return;
    const id = editingModel.id || `custom-${Date.now()}`;
    const m = { ...editingModel, id };
    const updated = customModels.some((x) => x.id === id)
      ? customModels.map((x) => x.id === id ? m : x)
      : [...customModels, m];
    setCustomModels(updated);
    saveCustomModels(updated);
    setEditingModel(null);
    window.dispatchEvent(new Event("arenaqa-keys-updated"));
  };

  const deleteCustomModel = (id: string) => {
    const updated = customModels.filter((m) => m.id !== id);
    setCustomModels(updated);
    saveCustomModels(updated);
    window.dispatchEvent(new Event("arenaqa-keys-updated"));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* 头部 + 标签 */}
        <div className="px-5 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">设置</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div className="flex gap-1 border-b border-gray-200">
            {[
              { key: "keys", label: "内置 Key" },
              { key: "judge", label: "裁判模型" },
              { key: "custom", label: "自定义模型" },
              { key: "nvidia", label: "NVIDIA NIM" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "keys" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">API Key 保存在本地浏览器中。可自定义每个模型的具体版本和 API 地址，避免调用到高价模型。</p>
              {BUILTIN_MODELS.map((m) => (
                <div key={m.id} className="p-3 bg-gray-50 rounded-xl space-y-2">
                  <div className="text-sm font-bold text-gray-800">{m.name}</div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">API Key</label>
                    <input
                      type="password"
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                      placeholder={m.keyHint}
                      value={keys[m.storagePrefix] || ""}
                      onChange={(e) => setKeys((prev) => ({ ...prev, [m.storagePrefix]: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Base URL</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                      placeholder={m.defaultBaseUrl || "（无需配置）"}
                      value={baseUrls[m.storagePrefix] || ""}
                      onChange={(e) => setBaseUrls((prev) => ({ ...prev, [m.storagePrefix]: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Model ID</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                      placeholder={m.defaultModelId}
                      value={modelIds[m.storagePrefix] || ""}
                      onChange={(e) => setModelIds((prev) => ({ ...prev, [m.storagePrefix]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
              <button onClick={handleSaveKeys} className={`w-full py-2 rounded-lg text-sm font-semibold text-white transition-colors ${saved ? "bg-emerald-500" : "bg-indigo-500 hover:bg-indigo-600"}`}>
                {saved ? "已保存" : "保存内置模型配置"}
              </button>
            </div>
          )}

          {tab === "judge" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">配置 AI 裁判模型。支持任意 OpenAI 兼容 API（如 DeepSeek、通义千问、本地模型等均可作为裁判）。</p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">裁判 API Base URL</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  placeholder="https://api.deepseek.com"
                  value={judgeBaseUrl}
                  onChange={(e) => setJudgeBaseUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">裁判 API Key</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  placeholder="sk-xxx"
                  value={judgeApiKey}
                  onChange={(e) => setJudgeApiKey(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">裁判模型 ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  placeholder="gpt-4o / deepseek-chat / qwen-plus"
                  value={judgeModelId}
                  onChange={(e) => setJudgeModelId(e.target.value)}
                />
              </div>
              <button onClick={handleSaveJudge} className={`w-full py-2 rounded-lg text-sm font-semibold text-white transition-colors ${saved ? "bg-emerald-500" : "bg-indigo-500 hover:bg-indigo-600"}`}>
                {saved ? "已保存" : "保存裁判配置"}
              </button>
            </div>
          )}

          {tab === "nvidia" && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                NVIDIA NIM 提供免费 API（40 次/分钟），支持 DeepSeek、千问、Kimi、智谱、Llama 等模型。
                填写 API Key 后，在左侧面板会出现「NVIDIA NIM」区域，可多选模型参赛。
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">NVIDIA NIM API Key</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  placeholder="nvapi-..."
                  value={nimApiKey}
                  onChange={(e) => setNimApiKey(e.target.value)}
                />
              </div>
              <button onClick={handleSaveNim} className={`w-full py-2 rounded-lg text-sm font-semibold text-white transition-colors ${saved ? "bg-emerald-500" : "bg-indigo-500 hover:bg-indigo-600"}`}>
                {saved ? "已保存" : "保存 NVIDIA NIM"}
              </button>
            </div>
          )}

          {tab === "custom" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">添加任意 OpenAI 兼容 API 模型（如本地 Ollama、第三方中转站等）。</p>

              {customModels.map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{m.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{m.apiBase} · {m.modelId}</div>
                  </div>
                  <button onClick={() => setEditingModel(m)} className="text-xs text-indigo-500 hover:text-indigo-700 px-1">编辑</button>
                  <button onClick={() => deleteCustomModel(m.id)} className="text-xs text-red-400 hover:text-red-600 px-1">删除</button>
                </div>
              ))}

              {editingModel ? (
                <div className="space-y-2 p-3 border border-indigo-200 rounded-lg bg-indigo-50/30">
                  <input className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm" placeholder="显示名称 (如: 本地Qwen)" value={editingModel.name} onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })} />
                  <input className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm" placeholder="API Base URL (如: http://localhost:11434/v1)" value={editingModel.apiBase} onChange={(e) => setEditingModel({ ...editingModel, apiBase: e.target.value })} />
                  <input className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm" type="password" placeholder="API Key" value={editingModel.apiKey} onChange={(e) => setEditingModel({ ...editingModel, apiKey: e.target.value })} />
                  <input className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm" placeholder="Model ID (如: qwen2.5)" value={editingModel.modelId} onChange={(e) => setEditingModel({ ...editingModel, modelId: e.target.value })} />
                  <div className="flex gap-2">
                    <button onClick={saveCustomModel} className="flex-1 py-1.5 bg-indigo-500 text-white rounded text-sm font-medium">保存</button>
                    <button onClick={() => setEditingModel(null)} className="px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-500">取消</button>
                  </div>
                </div>
              ) : (
                <button onClick={addCustomModel} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                  + 添加自定义模型
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
