"use client";

import { useState, useEffect } from "react";
import { NIM_SMALL_MODELS, NIM_LARGE_MODELS, getEnabledNimModels, saveEnabledNimModels } from "@/lib/nim-models";
import { BUILTIN_MODELS, getLocalStorageKey } from "@/lib/model-registry";

interface CustomModel {
  id: string;
  name: string;
  apiBase: string;
  apiKey: string;
  modelId: string;
}

function loadCustomModels(): CustomModel[] {
  try {
    const raw = localStorage.getItem("arenaqa-custom-models");
    return raw ? JSON.parse(raw) : [];
  } catch { console.warn('[SettingsModal] loadCustomModels JSON parse failed'); return []; }
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
  const [nimEnabled, setNimEnabled] = useState<string[]>([]);

  // 密码可见性切换
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const toggleKeyVisibility = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;
    const stored: Record<string, string> = {};
    const urls: Record<string, string> = {};
    const mids: Record<string, string> = {};
    BUILTIN_MODELS.forEach((m) => {
      stored[m.storagePrefix] = localStorage.getItem(getLocalStorageKey(m.storagePrefix, 'API_KEY')) || "";
      urls[m.storagePrefix] = localStorage.getItem(getLocalStorageKey(m.storagePrefix, 'BASE_URL')) || m.defaultBaseUrl;
      mids[m.storagePrefix] = localStorage.getItem(getLocalStorageKey(m.storagePrefix, 'MODEL_ID')) || m.defaultModelId;
    });
    setKeys(stored);
    setBaseUrls(urls);
    setModelIds(mids);
    setCustomModels(loadCustomModels());
    setJudgeApiKey(localStorage.getItem("arenaqa-JUDGE_API_KEY") || "");
    setJudgeBaseUrl(localStorage.getItem("arenaqa-JUDGE_BASE_URL") || "");
    setJudgeModelId(localStorage.getItem("arenaqa-JUDGE_MODEL") || "gpt-4o");
    setNimApiKey(localStorage.getItem("arenaqa-NIM_API_KEY") || "");
    setNimEnabled(getEnabledNimModels());
    setSaved(false);
  }, [open]);

  const handleSaveKeys = () => {
    BUILTIN_MODELS.forEach((m) => {
      const prefix = m.storagePrefix;
      const apiKeyKey = getLocalStorageKey(prefix, 'API_KEY');
      const baseUrlKey = getLocalStorageKey(prefix, 'BASE_URL');
      const modelIdKey = getLocalStorageKey(prefix, 'MODEL_ID');
      if (keys[prefix]) localStorage.setItem(apiKeyKey, keys[prefix]);
      else localStorage.removeItem(apiKeyKey);
      if (baseUrls[prefix] && baseUrls[prefix] !== m.defaultBaseUrl) localStorage.setItem(baseUrlKey, baseUrls[prefix]);
      else localStorage.removeItem(baseUrlKey);
      if (modelIds[prefix] && modelIds[prefix] !== m.defaultModelId) localStorage.setItem(modelIdKey, modelIds[prefix]);
      else localStorage.removeItem(modelIdKey);
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
    saveEnabledNimModels(nimEnabled);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.dispatchEvent(new Event("arenaqa-keys-updated"));
  };

  const toggleNimModel = (id: string) => {
    setNimEnabled((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllNim = () => {
    setNimEnabled([...NIM_SMALL_MODELS, ...NIM_LARGE_MODELS].map((m) => m.id));
  };

  const deselectAllNim = () => {
    setNimEnabled([]);
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
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* 头部 + 标签 */}
        <div className="px-5 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">设置</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {[
              { key: "keys", label: "内置 Key" },
              { key: "judge", label: "裁判模型" },
              { key: "custom", label: "自定义模型" },
              { key: "nvidia", label: "NVIDIA NIM" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
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
              <p className="text-xs text-gray-500 dark:text-gray-400">API Key 保存在本地浏览器中。可自定义每个模型的具体版本和 API 地址，避免调用到高价模型。</p>
              {BUILTIN_MODELS.map((m) => (
                <div key={m.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-2">
                  <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{m.displayName}</div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">API Key</label>
                    <div className="relative">
                      <input
                        type={visibleKeys.has(m.storagePrefix) ? "text" : "password"}
                        className="w-full px-2.5 py-1.5 pr-8 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:bg-gray-700 dark:text-gray-200"
                        placeholder={m.keyHint}
                        value={keys[m.storagePrefix] || ""}
                        onChange={(e) => setKeys((prev) => ({ ...prev, [m.storagePrefix]: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => toggleKeyVisibility(m.storagePrefix)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 rounded"
                        title="显示/隐藏"
                      >
                        {visibleKeys.has(m.storagePrefix) ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Base URL</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                      placeholder={m.defaultBaseUrl || "（无需配置）"}
                      value={baseUrls[m.storagePrefix] || ""}
                      onChange={(e) => setBaseUrls((prev) => ({ ...prev, [m.storagePrefix]: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Model ID</label>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">配置 AI 裁判模型。支持任意 OpenAI 兼容 API（如 DeepSeek、通义千问、本地模型等均可作为裁判）。</p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">裁判 API Base URL</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  placeholder="https://api.deepseek.com"
                  value={judgeBaseUrl}
                  onChange={(e) => setJudgeBaseUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">裁判 API Key</label>
                <div className="relative">
                  <input
                    type={visibleKeys.has("judge") ? "text" : "password"}
                    className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    placeholder="sk-xxx"
                    value={judgeApiKey}
                    onChange={(e) => setJudgeApiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility("judge")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 rounded"
                    title="显示/隐藏"
                  >
                    {visibleKeys.has("judge") ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">裁判模型 ID</label>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                NVIDIA NIM 提供免费 API（40 次/分钟）。配置 API Key 后，只有下方勾选的模型会出现在左侧面板。
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">NVIDIA NIM API Key</label>
                <div className="relative">
                  <input
                    type={visibleKeys.has("nim") ? "text" : "password"}
                    className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    placeholder="nvapi-..."
                    value={nimApiKey}
                    onChange={(e) => setNimApiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility("nim")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 rounded"
                    title="显示/隐藏"
                  >
                    {visibleKeys.has("nim") ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* 全选/取消 */}
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  可用模型 ({nimEnabled.length}/{NIM_SMALL_MODELS.length + NIM_LARGE_MODELS.length})
                </span>
                <div className="flex gap-2">
                  <button onClick={selectAllNim} className="text-[10px] px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">全选</button>
                  <button onClick={deselectAllNim} className="text-[10px] px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">取消</button>
                </div>
              </div>

              {/* 快速小模型 */}
              <div>
                <div className="text-xs font-medium text-amber-600 mb-2">⚡ 快速小模型</div>
                <div className="space-y-1">
                  {NIM_SMALL_MODELS.map((m) => {
                    const enabled = nimEnabled.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => toggleNimModel(m.id)}
                          className="accent-indigo-500 w-3.5 h-3.5"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{m.name}</span>
                          <span className="text-[10px] text-gray-400 ml-1.5">{m.desc}</span>
                        </div>
                        <span className="text-gray-300 dark:text-gray-600 text-[9px]">{m.id.replace("nim-", "")}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 大参数模型 */}
              <div>
                <div className="text-xs font-medium text-purple-600 mb-2">🦾 大参数模型</div>
                <div className="space-y-1">
                  {NIM_LARGE_MODELS.map((m) => {
                    const enabled = nimEnabled.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => toggleNimModel(m.id)}
                          className="accent-indigo-500 w-3.5 h-3.5"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{m.name}</span>
                          <span className="text-[10px] text-gray-400 ml-1.5">{m.desc}</span>
                        </div>
                        <span className="text-gray-300 dark:text-gray-600 text-[9px]">{m.id.replace("nim-", "")}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button onClick={handleSaveNim} className={`w-full py-2 rounded-lg text-sm font-semibold text-white transition-colors ${saved ? "bg-emerald-500" : "bg-indigo-500 hover:bg-indigo-600"}`}>
                {saved ? "已保存" : "保存 NVIDIA NIM"}
              </button>
            </div>
          )}

          {tab === "custom" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">添加任意 OpenAI 兼容 API 模型（如本地 Ollama、第三方中转站等）。</p>

              {customModels.map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg dark:border dark:border-gray-700">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{m.name}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{m.apiBase} · {m.modelId}</div>
                  </div>
                  <button onClick={() => setEditingModel(m)} className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 px-1">编辑</button>
                  <button onClick={() => deleteCustomModel(m.id)} className="text-xs text-red-400 hover:text-red-600 px-1">删除</button>
                </div>
              ))}

              {editingModel ? (
                <div className="space-y-2 p-3 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50/30 dark:bg-gray-800">
                  <input className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-200" placeholder="显示名称 (如: 本地Qwen)" value={editingModel.name} onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })} />
                  <input className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-200" placeholder="API Base URL (如: http://localhost:11434/v1)" value={editingModel.apiBase} onChange={(e) => setEditingModel({ ...editingModel, apiBase: e.target.value })} />
                  <div className="relative">
                    <input className="w-full px-2.5 py-1.5 pr-8 border border-gray-200 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-200" type={visibleKeys.has("custom-editor") ? "text" : "password"} placeholder="API Key" value={editingModel.apiKey} onChange={(e) => setEditingModel({ ...editingModel, apiKey: e.target.value })} />
                    <button type="button" onClick={() => toggleKeyVisibility("custom-editor")} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 rounded" title="显示/隐藏">
                      {visibleKeys.has("custom-editor") ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  <input className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-200" placeholder="Model ID (如: qwen2.5)" value={editingModel.modelId} onChange={(e) => setEditingModel({ ...editingModel, modelId: e.target.value })} />
                  <div className="flex gap-2">
                    <button onClick={saveCustomModel} className="flex-1 py-1.5 bg-indigo-500 text-white rounded text-sm font-medium">保存</button>
                    <button onClick={() => setEditingModel(null)} className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-500 dark:text-gray-400">取消</button>
                  </div>
                </div>
              ) : (
                <button onClick={addCustomModel} className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-500 dark:hover:border-indigo-400 transition-colors">
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
