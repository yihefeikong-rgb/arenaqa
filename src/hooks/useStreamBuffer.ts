"use client";

import { useRef, useCallback } from "react";

const SENTENCE_ENDINGS = /[。！？\n]/;
const FLUSH_TIMEOUT = 300;

interface BufferEntry {
  chunks: string[];
  timer: ReturnType<typeof setTimeout> | null;
}

export function useStreamBuffer() {
  const buffers = useRef<Map<string, BufferEntry>>(new Map());

  const addChunk = useCallback(
    (model: string, chunk: string, onFlush: (model: string, text: string) => void) => {
      if (!buffers.current.has(model)) {
        buffers.current.set(model, { chunks: [], timer: null });
      }
      const entry = buffers.current.get(model)!;
      entry.chunks.push(chunk);

      if (entry.timer) {
        clearTimeout(entry.timer);
        entry.timer = null;
      }

      const accumulated = entry.chunks.join("");

      if (SENTENCE_ENDINGS.test(accumulated)) {
        const text = entry.chunks.join("");
        entry.chunks = [];
        onFlush(model, text);
      } else {
        entry.timer = setTimeout(() => {
          if (entry.chunks.length > 0) {
            const text = entry.chunks.join("");
            entry.chunks = [];
            onFlush(model, text);
          }
        }, FLUSH_TIMEOUT);
      }
    },
    []
  );

  const flushAll = useCallback((onFlush: (model: string, text: string) => void) => {
    buffers.current.forEach((entry, model) => {
      if (entry.timer) {
        clearTimeout(entry.timer);
        entry.timer = null;
      }
      if (entry.chunks.length > 0) {
        const text = entry.chunks.join("");
        entry.chunks = [];
        onFlush(model, text);
      }
    });
  }, []);

  const reset = useCallback((model?: string) => {
    if (model) {
      const entry = buffers.current.get(model);
      if (entry?.timer) clearTimeout(entry.timer);
      buffers.current.delete(model);
    } else {
      buffers.current.forEach((entry) => {
        if (entry.timer) clearTimeout(entry.timer);
      });
      buffers.current.clear();
    }
  }, []);

  return { addChunk, flushAll, reset };
}
