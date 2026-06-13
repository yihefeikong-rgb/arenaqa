"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/useChat";
import { ImageUploader } from "@/components/InputPanel/ImageUploader";

const SLASH_COMMANDS = [
  { prefix: "/compare", label: "对比分析", desc: "多模型对比", template: "请对比分析以下内容，列出各自的优缺点：\n\n" },
  { prefix: "/explain", label: "详细解释", desc: "深入讲解概念", template: "请详细解释以下概念，适合初学者理解：\n\n" },
  { prefix: "/code", label: "代码实现", desc: "编程任务", template: "请用代码实现以下需求，包含关键注释：\n\n" },
];

export function PromptInputBar() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [slashIndex, setSlashIndex] = useState(0);
  const [showSlash, setShowSlash] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedModels = useChatStore((s) => s.selectedModels);
  const status = useChatStore((s) => s.status);
  const conversationId = useChatStore((s) => s.conversationId);
  const rounds = useChatStore((s) => s.rounds);
  const { sendChat } = useChat();

  const isFollowUp = !!conversationId && rounds.length > 0;

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
    textareaRef.current?.blur();
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
    : isFollowUp ? "继续追问"
    : "发起对比";

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-t-gray-700 p-4 shrink-0">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <textarea
            ref={textareaRef}
            className="w-full min-h-[80px] max-h-[200px] resize-none p-3 pb-7 border-[1.5px] border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
             placeholder={isFollowUp ? "继续追问这个话题..." : "输入你的问题... (Enter 发送, Shift+Enter 换行)"}
            maxLength={4000}
            rows={2}
          />

          {/* Slash 命令菜单 */}
          {showSlash && matchingCommands.length > 0 && (
            <div
              className="absolute left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden z-10"
              style={{ bottom: "calc(100% + 4px)" }}
            >
              {matchingCommands.map((cmd, i) => (
                <button
                  key={cmd.prefix}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 transition-colors ${
                    i === slashIndex ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySlashCommand(cmd);
                  }}
                >
                  <span className="w-7 h-7 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                    /
                  </span>
                  <div>
                    <div className="font-medium text-xs">{cmd.label}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">{cmd.desc}</div>
                  </div>
                  <span className="ml-auto text-[10px] text-gray-300 dark:text-gray-500 font-mono">{cmd.prefix}</span>
                </button>
              ))}
            </div>
          )}

          <span className="absolute bottom-2 right-3 text-[11px] text-gray-400">{prompt.length} / 4000</span>

          {!showSlash && prompt === "" && (
            <span className="absolute bottom-2 left-3 text-[11px] text-gray-300">
              输入 / 使用快捷指令
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          <ImageUploader images={images} onChange={setImages} />

          <button
            type="button"
            disabled={!canSend}
            onClick={handleSend}
            className={`ml-auto px-6 py-2 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition-all shrink-0 ${
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
        </div>
      </div>
    </div>
  );
}
