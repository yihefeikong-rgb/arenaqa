"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/useChat";
import { ModelCard } from "./ModelCard";
import { ImageUploader } from "./ImageUploader";

const SLASH_COMMANDS = [
  { prefix: "/compare", label: "对比分析", desc: "多模型对比", template: "请对比分析以下内容，列出各自的优缺点：\n\n" },
  { prefix: "/explain", label: "详细解释", desc: "深入讲解概念", template: "请详细解释以下概念，适合初学者理解：\n\n" },
  { prefix: "/code", label: "代码实现", desc: "编程任务", template: "请用代码实现以下需求，包含关键注释：\n\n" },
];

// NVIDIA NIM 模型定义
const NIM_SMALL_MODELS = [
  { id: "nim-deepseek-v4-flash", name: "DeepSeek V4 Flash", desc: "快速推理" },
  { id: "nim-qwen3-next", name: "Qwen3 Next 80B", desc: "轻量千问" },
  { id: "nim-step-3.5-flash", name: "Step 3.5 Flash", desc: "阶跃星辰" },
  { id: "nim-gemma-4", name: "Gemma 4 31B", desc: "Google" },
  { id: "nim-llama-3.1-8b", name: "Llama 3.1 8B", desc: "轻量 Meta" },
];

const NIM_LARGE_MODELS = [
  { id: "nim-deepseek-v4-pro", name: "DeepSeek V4 Pro", desc: "DeepSeek 旗舰" },
  { id: "nim-qwen3.5-122b", name: "Qwen3.5 122B", desc: "阿里千问" },
  { id: "nim-kimi-k2.6", name: "Kimi K2.6", desc: "月之暗面" },
  { id: "nim-glm-5.1", name: "GLM 5.1", desc: "智谱" },
  { id: "nim-minimax-m2.7", name: "MiniMax M2.7", desc: "MiniMax" },
  { id: "nim-yi-large", name: "Yi Large", desc: "零一万物" },
  { id: "nim-llama-4", name: "Llama 4 Maverick", desc: "Meta 旗舰" },
  { id: "nim-llama-3.3-70b", name: "Llama 3.3 70B", desc: "Meta" },
  { id: "nim-mistral-large3", name: "Mistral Large 3", desc: "Mistral" },
];

interface ModelInfo {
  id: string;
  displayName: string;
  configured: boolean;
  description: string;
  providerType: string;
}

export function InputPanel() {
  const [prompt, setPrompt] = useState("");
  const [modelDefs, setModelDefs] = useState<ModelInfo[]>([]);
  const [nimKey, setNimKey] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [slashIndex, setSlashIndex] = useState(0);
  const [showSlash, setShowSlash] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const slashRef = useRef<HTMLDivElement>(null);

  const selectedModels = useChatStore((s) => s.selectedModels);
  const selectModel = useChatStore((s) => s.selectModel);
  const deselectModel = useChatStore((s) => s.deselectModel);
  const status = useChatStore((s) => s.status);
  const { sendChat } = useChat();

  // 模型名 → localStorage Key 映射
  const LS_KEY_MAP: Record<string, string> = {
    deepseek: "DEEPSEEK_API_KEY",
    qwen: "QWEN_API_KEY",
    claude: "ANTHROPIC_API_KEY",
    gemini: "GEMINI_API_KEY",
  };

  // 获取模型配置状态（合并 .env + 前端设置面板的 Key + 自定义模型）
  useEffect(() => {
    const loadModels = () => {
      fetch("/api/models")
        .then((r) => r.json())
        .then((data) => {
          const models: ModelInfo[] = (data.models || []).map((m: { name: string; display_name: string; enabled: boolean; description: string; provider_type: string }) => {
            const lsKey = LS_KEY_MAP[m.name];
            const hasLocalKey = lsKey ? !!localStorage.getItem(`arenaqa-${lsKey}`) : false;
            return {
              id: m.name,
              displayName: m.display_name,
              configured: m.enabled || hasLocalKey,
              description: m.description,
              providerType: m.provider_type,
            };
          });

          // 合并自定义模型
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
          } catch { /* ignore */ }


          setModelDefs(models);
        })
        .catch(() => {
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
    window.addEventListener("arenaqa-keys-updated", () => {
      setNimKey(localStorage.getItem("arenaqa-NIM_API_KEY") || "");
      loadModels();
    });
    return () => window.removeEventListener("arenaqa-keys-updated", loadModels);
  }, []);

  const visibleModels = modelDefs;

  // 检测 / 命令
  useEffect(() => {
    const cursorPos = textareaRef.current?.selectionStart ?? prompt.length;
    const textBeforeCursor = prompt.slice(0, cursorPos);
    const lastSlash = textBeforeCursor.lastIndexOf("/");

    if (lastSlash !== -1) {
      const afterSlash = textBeforeCursor.slice(lastSlash);
      const isNewWord = lastSlash === 0 || textBeforeCursor[lastSlash - 1] === " " || textBeforeCursor[lastSlash - 1] === "\n";
      if (isNewWord && !afterSlash.includes(" ")) {
        const matching = SLASH_COMMANDS.filter((c) => c.prefix.startsWith(afterSlash));
        setShowSlash(matching.length > 0);
        setSlashIndex(0);
        return;
      }
    }
    setShowSlash(false);
  }, [prompt]);

  const applySlashCommand = useCallback(
    (cmd: (typeof SLASH_COMMANDS)[0]) => {
      const cursorPos = textareaRef.current?.selectionStart ?? prompt.length;
      const textBeforeCursor = prompt.slice(0, cursorPos);
      const lastSlash = textBeforeCursor.lastIndexOf("/");
      const textAfterCursor = prompt.slice(cursorPos);

      const newPrompt = prompt.slice(0, lastSlash) + cmd.template + textAfterCursor;
      setPrompt(newPrompt);
      setShowSlash(false);

      const newCursorPos = lastSlash + cmd.template.length;
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    },
    [prompt]
  );

  const matchingCommands = useMemo(() => {
    const cursorPos = textareaRef.current?.selectionStart ?? prompt.length;
    const textBeforeCursor = prompt.slice(0, cursorPos);
    const lastSlash = textBeforeCursor.lastIndexOf("/");
    if (lastSlash === -1) return [];
    const afterSlash = textBeforeCursor.slice(lastSlash);
    return SLASH_COMMANDS.filter((c) => c.prefix.startsWith(afterSlash));
  }, [prompt]);

  const canSend = prompt.trim().length > 0 && selectedModels.length > 0 && status === "idle";

  const handleSend = () => {
    if (!canSend) return;
    let finalPrompt = prompt;
    if (images.length > 0) {
      const imgTags = images.map((src) => `![image](${src})`).join("\n");
      finalPrompt = `${imgTags}\n\n${prompt}`;
    }
    sendChat(finalPrompt, selectedModels);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlash) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((prev) => (prev + 1) % matchingCommands.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((prev) => (prev - 1 + matchingCommands.length) % matchingCommands.length);
        return;
      }
      if (e.key === "Enter" && matchingCommands.length > 0) {
        e.preventDefault();
        applySlashCommand(matchingCommands[slashIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowSlash(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 粘贴图片
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              setImages((prev) => {
                if (prev.length >= 3) return prev;
                return [...prev, dataUrl];
              });
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    },
    []
  );

  // 拖拽图片
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    const readers = imageFiles.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((dataUrls) => {
      setImages((prev) => {
        const remaining = 3 - prev.length;
        return [...prev, ...dataUrls.slice(0, remaining)];
      });
    });
  }, []);

  const btnLabel =
    status === "streaming" ? "生成中..."
    : status === "judging" ? "评分中..."
    : status === "fusing" ? "融合中..."
    : images.length > 0 ? `发起对比 (含${images.length}图)`
    : "发起对比";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">选择参赛模型</h3>
        <span className="text-xs text-gray-500">{selectedModels.length}/6</span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {visibleModels.map((m) => (
            <ModelCard
              key={m.id}
              model={m.id}
              enabled={m.configured}
            />
          ))}
        </div>

        {/* NVIDIA NIM 多模型选择 */}
        {nimKey && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-1.5 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600"><rect x="4" y="4" width="16" height="16" rx="2" /><polyline points="9 12 11 14 15 10" /></svg>
              <span className="text-sm font-semibold text-gray-900">NVIDIA NIM</span>
              <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-full">40次/分钟 · 免费</span>
            </div>

            <div className="mb-2">
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-xs font-medium text-amber-600">⚡ 快速小模型</span>
                <span className="text-[10px] text-gray-400">适合简单问答</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {NIM_SMALL_MODELS.map((m) => {
                  const isSelected = selectedModels.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => isSelected ? deselectModel(m.id) : selectModel(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isSelected ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-indigo-200 hover:text-indigo-500"
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-xs font-medium text-purple-600">🦾 大参数模型</span>
                <span className="text-[10px] text-gray-400">高质量长回答</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {NIM_LARGE_MODELS.map((m) => {
                  const isSelected = selectedModels.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => isSelected ? deselectModel(m.id) : selectModel(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isSelected ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-indigo-200 hover:text-indigo-500"
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5">
          <label className="text-sm font-semibold text-gray-900 block mb-2">输入问题</label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              className="w-full min-h-[100px] resize-y p-3 pb-7 border-[1.5px] border-gray-200 rounded-lg text-sm bg-white text-gray-800 transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              placeholder="什么是量子计算？它与传统计算机有什么区别？"
              maxLength={4000}
            />

            {/* Slash 命令菜单 */}
            {showSlash && matchingCommands.length > 0 && (
              <div
                ref={slashRef}
                className="absolute left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10"
                style={{ bottom: "calc(100% + 4px)" }}
              >
                {matchingCommands.map((cmd, i) => (
                  <button
                    key={cmd.prefix}
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 transition-colors ${
                      i === slashIndex ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applySlashCommand(cmd);
                    }}
                  >
                    <span className="w-7 h-7 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                      /
                    </span>
                    <div>
                      <div className="font-medium text-xs">{cmd.label}</div>
                      <div className="text-[10px] text-gray-400">{cmd.desc}</div>
                    </div>
                    <span className="ml-auto text-[10px] text-gray-300 font-mono">{cmd.prefix}</span>
                  </button>
                ))}
              </div>
            )}

            <span className="absolute bottom-2 right-3 text-[11px] text-gray-400">{prompt.length} / 4000</span>

            {/* 提示：Slash 可用 */}
            {!showSlash && prompt === "" && (
              <span className="absolute bottom-2 left-3 text-[11px] text-gray-300">
                输入 / 使用快捷指令
              </span>
            )}
          </div>
        </div>

        {/* 图片上传器 */}
        <div className="mt-2">
          <ImageUploader images={images} onChange={setImages} />
        </div>

        <button
          type="button"
          disabled={!canSend}
          onClick={handleSend}
          className={`w-full mt-3 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 transition-all ${
            canSend
              ? "bg-indigo-500 text-white hover:bg-indigo-600 active:bg-indigo-700 hover:shadow-sm"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {status !== "idle" && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {btnLabel}
        </button>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 leading-relaxed">
          <strong className="text-gray-700">提示</strong><br />
          选择 2-4 个模型进行对比。输入 / 可使用快捷指令。支持粘贴或拖拽上传图片（最多 3 张）。
        </div>
      </div>
    </div>
  );
}
