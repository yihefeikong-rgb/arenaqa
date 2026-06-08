// ============================================================
// useChatStream — SSE 流式连接 Hook
// ============================================================

'use client';

import { useCallback, useRef } from 'react';
import { useChatStore } from '@/stores/chat-store';

export function useChatStream() {
  const abortRef = useRef<AbortController | null>(null);
  const { status } = useChatStore();

  const send = useCallback(
    async (prompt: string, models: string[]) => {
      await useChatStore.getState().sendChat(prompt, models);
    },
    []
  );

  const abort = useCallback(async (taskId?: string) => {
    if (taskId) {
      await fetch(`/api/chat/abort/${taskId}`, { method: 'POST' });
    }
    abortRef.current?.abort();
  }, []);

  return {
    send,
    abort,
    isLoading: status === 'streaming' || status === 'judging' || status === 'fusing',
  };
}
