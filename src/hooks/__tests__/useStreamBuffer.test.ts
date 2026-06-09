import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreamBuffer } from '@/hooks/useStreamBuffer';

describe('useStreamBuffer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addChunk', () => {
    it('should flush on sentence-ending punctuation (。！？\n)', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Hello world。', onFlush);
      });

      expect(onFlush).toHaveBeenCalledWith('model-a', 'Hello world。');
    });

    it('should flush on exclamation mark', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Great！', onFlush);
      });

      expect(onFlush).toHaveBeenCalledWith('model-a', 'Great！');
    });

    it('should flush on question mark', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Really？', onFlush);
      });

      expect(onFlush).toHaveBeenCalledWith('model-a', 'Really？');
    });

    it('should flush on newline', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Line 1\n', onFlush);
      });

      expect(onFlush).toHaveBeenCalledWith('model-a', 'Line 1\n');
    });

    it('should buffer chunks without sentence ending', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Hello', onFlush);
      });

      expect(onFlush).not.toHaveBeenCalled();
    });

    it('should accumulate chunks in buffer until flush', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Hello ', onFlush);
        result.current.addChunk('model-a', 'World', onFlush);
      });

      expect(onFlush).not.toHaveBeenCalled();

      act(() => {
        result.current.addChunk('model-a', '。', onFlush);
      });

      expect(onFlush).toHaveBeenCalledWith('model-a', 'Hello World。');
    });

    it('should handle multiple models independently', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Hello ', onFlush);
        result.current.addChunk('model-b', 'World', onFlush);
      });

      expect(onFlush).not.toHaveBeenCalled();

      act(() => {
        result.current.addChunk('model-a', '。', onFlush);
      });

      expect(onFlush).toHaveBeenCalledTimes(1);
      expect(onFlush).toHaveBeenCalledWith('model-a', 'Hello 。');
    });

    it('should flush after timeout when no sentence ending', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Hello World', onFlush);
      });

      expect(onFlush).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(onFlush).toHaveBeenCalledWith('model-a', 'Hello World');
    });

    it('should reset timer on new chunk before timeout', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Hello', onFlush);
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(onFlush).not.toHaveBeenCalled();

      // New chunk resets timer
      act(() => {
        result.current.addChunk('model-a', ' World', onFlush);
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Only 200ms elapsed since last chunk, not 300
      expect(onFlush).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onFlush).toHaveBeenCalledWith('model-a', 'Hello World');
    });

    it('should not flush if chunk buffer is empty after timeout', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Full。', onFlush);
      });

      // After flush, the buffer is empty. Timer should not fire for empty buffer.
      expect(onFlush).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onFlush).toHaveBeenCalledTimes(1);
    });
  });

  describe('flushAll', () => {
    it('should flush all pending buffers', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Hello ', onFlush);
        result.current.addChunk('model-b', 'World', onFlush);
      });

      act(() => {
        result.current.flushAll(onFlush);
      });

      expect(onFlush).toHaveBeenCalledTimes(2);
      expect(onFlush).toHaveBeenCalledWith('model-a', 'Hello ');
      expect(onFlush).toHaveBeenCalledWith('model-b', 'World');
    });

    it('should clear pending timers on flushAll', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Delayed', onFlush);
      });

      act(() => {
        result.current.flushAll(onFlush);
      });

      // Timer should not fire after flushAll
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onFlush).toHaveBeenCalledTimes(1); // only from flushAll
    });
  });

  describe('reset', () => {
    it('should clear buffer for a specific model', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Hello', onFlush);
      });

      act(() => {
        result.current.reset('model-a');
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onFlush).not.toHaveBeenCalled();
    });

    it('should clear buffer for all models when called without argument', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Hello', onFlush);
        result.current.addChunk('model-b', 'World', onFlush);
      });

      act(() => {
        result.current.reset();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onFlush).not.toHaveBeenCalled();
    });

    it('should clear pending timers on reset', () => {
      const { result } = renderHook(() => useStreamBuffer());
      const onFlush = vi.fn();

      act(() => {
        result.current.addChunk('model-a', 'Hello', onFlush);
      });

      act(() => {
        result.current.reset();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onFlush).not.toHaveBeenCalled();
    });

    it('should not throw when resetting non-existent model', () => {
      const { result } = renderHook(() => useStreamBuffer());

      expect(() => {
        result.current.reset('non-existent');
      }).not.toThrow();
    });
  });
});
