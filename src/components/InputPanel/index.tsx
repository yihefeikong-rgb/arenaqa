"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import { ModelCard } from "./ModelCard";
import { NIM_SMALL_MODELS, NIM_LARGE_MODELS, getEnabledNimModels } from "@/lib/nim-models";
import { BUILTIN_MODELS, getLocalStorageKey } from "@/lib/model-registry";

const MODEL_GRADIENT: Record<string, string> = {
  deepseek: "from-blue-500 to-cyan-500",
  qwen: "from-violet-500 to-pink-500",
  claude: "from-amber-500 to-orange-500",
  gemini: "from-emerald-500 to-teal-500",
};

interface ModelInfo {
  id: string;
  displayName: string;
  configured: boolean;
  description: string;
  providerType: string;
}

function getMeta(model: string, modelDefs: ModelInfo[]): { name: string; icon: string } {
  const def = modelDefs.find((m) => m.id === model);
  if (def) return { name: def.displayName, icon: def.displayName.slice(0, 2).toUpperCase() };
  const allNim = [...NIM_SMALL_MODELS, ...NIM_LARGE_MODELS];
  const nim = allNim.find((m) => m.id === model);
  if (nim) return { name: nim.name, icon: nim.name.slice(0, 2).toUpperCase() };
  return { name: model, icon: model.slice(0, 2).toUpperCase() };
}

function getGradient(model: string): string {
  return MODEL_GRADIENT[model] || "from-gray-500 to-gray-400";
}

export function InputPanel() {
  const [modelDefs, setModelDefs] = useState<ModelInfo[]>([]);
  const [nimKey, setNimKey] = useState("");
  const [showSelector, setShowSelector] = useState(false);

  const selectedModels = useChatStore((s) => s.selectedModels);
  const selectModel = useChatStore((s) => s.selectModel);
  const deselectModel = useChatStore((s) => s.deselectModel);

  useEffect(() => {
    const loadModels = () => {
      fetch("/api/models")
        .then((r) => r.json())
        .then((data) => {
          const models: ModelInfo[] = (data.models || []).map((m: { name: string; display_name: string; enabled: boolean; description: string; provider_type: string }) => {
            const def = BUILTIN_MODELS.find((d) => d.id === m.name);
            const hasLocalKey = def ? !!localStorage.getItem(getLocalStorageKey(def.storagePrefix, 'API_KEY')) : false;
            return {
              id: m.name,
              displayName: m.display_name,
              configured: m.enabled || hasLocalKey,
              description: m.description,
              providerType: m.provider_type,
            };
          });

          try {
            const raw = localStorage.getItem("arenaqa-custom-models");
            if (raw) {
              const customModels = JSON.parse(raw);
              customModels.forEach((cm: { id: string; name: string; apiBase: string; modelId: string }) => {
                models.push({
                  id: cm.id,
                  displayName: cm.name,
                  configured: true,
                  description: `自定义 · ${cm.modelId}`,
                  providerType: "openai_compat",
                });
              });
            }
          } catch { console.warn('[InputPanel] custom models JSON parse failed'); }

          setModelDefs(models);
        })
        .catch((e) => {
          console.warn('[InputPanel] /api/models fetch failed, using defaults', e);
          setModelDefs([
            { id: "deepseek", displayName: "DeepSeek V3", configured: true, description: "", providerType: "openai_compat" },
            { id: "qwen", displayName: "通义千问", configured: true, description: "", providerType: "openai_compat" },
            { id: "claude", displayName: "Claude", configured: true, description: "", providerType: "anthropic" },
            { id: "gemini", displayName: "Gemini", configured: true, description: "", providerType: "google" },
          ]);
        });
    };

    loadModels();
    setNimKey(localStorage.getItem("arenaqa-NIM_API_KEY") || "");
    const handleKeysUpdated = () => {
      setNimKey(localStorage.getItem("arenaqa-NIM_API_KEY") || "");
      loadModels();
    };
    window.addEventListener("arenaqa-keys-updated", handleKeysUpdated);
    return () => window.removeEventListener("arenaqa-keys-updated", handleKeysUpdated);
  }, []);

  const isFull = selectedModels.length >= 6;

  return (
    <div className="flex flex-col h-full">
      {/* 选中列表区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">已选模型</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{selectedModels.length}/6</span>
        </div>

        {selectedModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-2 opacity-40">
              <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <div className="text-xs">尚未选择模型</div>
            <div className="text-[10px] mt-0.5">点击下方按钮添加参赛模型</div>
          </div>
        ) : (
          <div className="px-2 space-y-0.5">
            {selectedModels.map((model) => {
              const meta = getMeta(model, modelDefs);
              const gradient = getGradient(model);
              return (
                <div key={model} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group transition-colors">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                    {meta.icon}
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{meta.name}</span>
                  <button
                    onClick={() => deselectModel(model)}
                    className="w-5 h-5 rounded hover:bg-red-50 flex items-center justify-center text-red-400 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0"
                    title="移除"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 添加模型按钮 */}
      <div className="px-3 py-2.5 border-t border-gray-100 dark:border-gray-700 shrink-0">
        <button
          type="button"
          onClick={() => setShowSelector(true)}
          disabled={isFull}
          className={`w-full py-2 text-xs font-medium border-2 border-dashed rounded-lg transition-colors ${
            isFull
              ? "border-gray-200 dark:border-gray-600 text-gray-300 cursor-not-allowed"
              : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-600"
          }`}
        >
          + 添加模型
        </button>
      </div>

      {/* 模型选择弹窗 */}
      {showSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50" onClick={() => setShowSelector(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full mx-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">添加参赛模型</h3>
              <button onClick={() => setShowSelector(false)} className="w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {modelDefs.map((m) => (
                  <ModelCard key={m.id} model={m.id} enabled={m.configured} />
                ))}
              </div>

              {nimKey && (() => {
                const enabledIds = getEnabledNimModels();
                const smallModels = NIM_SMALL_MODELS.filter((m) => enabledIds.includes(m.id));
                const largeModels = NIM_LARGE_MODELS.filter((m) => enabledIds.includes(m.id));
                if (smallModels.length === 0 && largeModels.length === 0) return null;
                return (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1.5 mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600"><rect x="4" y="4" width="16" height="16" rx="2" /><polyline points="9 12 11 14 15 10" /></svg>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">NVIDIA NIM</span>
                      <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-full">免费</span>
                    </div>

                    {smallModels.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs font-medium text-amber-600 mb-1.5">⚡ 快速小模型</div>
                        <div className="flex flex-wrap gap-1.5">
                          {smallModels.map((m) => {
                            const isSelected = selectedModels.includes(m.id);
                            return (
                              <button key={m.id}
                                onClick={() => isSelected ? deselectModel(m.id) : selectModel(m.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                  isSelected ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 text-indigo-700" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-200 hover:text-indigo-500"
                                }`}
                              >
                                {m.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {largeModels.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-purple-600 mb-1.5">🦾 大参数模型</div>
                        <div className="flex flex-wrap gap-1.5">
                          {largeModels.map((m) => {
                            const isSelected = selectedModels.includes(m.id);
                            return (
                              <button key={m.id}
                                onClick={() => isSelected ? deselectModel(m.id) : selectModel(m.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                  isSelected ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 text-indigo-700" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-200 hover:text-indigo-500"
                                }`}
                              >
                                {m.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={() => setShowSelector(false)}
                className="w-full py-2 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
