import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SSEManager } from '@/lib/sse-manager';

describe('SSEManager', () => {
  let manager: SSEManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new SSEManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Helper: subscribe to get a live task stream, then we can publish events to it.
   */
  function initTask(taskId: string) {
    const listener = vi.fn();
    manager.subscribe(taskId, listener);
    return listener;
  }

  describe('subscribe', () => {
    it('should return an unsubscribe function', () => {
      const unsub = manager.subscribe('task1', vi.fn());
      expect(typeof unsub).toBe('function');
    });

    it('should replay cached events for new subscribers', () => {
      const l1 = vi.fn();
      manager.subscribe('task1', l1);       // creates the stream
      manager.publish('task1', 'chunk', { content: 'hello' });

      const l2 = vi.fn();
      manager.subscribe('task1', l2);       // late subscriber — should replay
      expect(l2).toHaveBeenCalledTimes(1);
      expect(l2).toHaveBeenCalledWith({
        event: 'chunk',
        data: JSON.stringify({ content: 'hello' }),
      });
    });

    it('should deliver new events after subscription', () => {
      const listener = vi.fn();
      manager.subscribe('task1', listener);
      manager.publish('task1', 'chunk', { content: 'world' });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should replay all cached events for late subscribers', () => {
      initTask('task1');
      manager.publish('task1', 'chunk', { content: 'a' });
      manager.publish('task1', 'chunk', { content: 'b' });

      const listener = vi.fn();
      manager.subscribe('task1', listener);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should not deliver events to unsubscribed listeners', () => {
      const listener = vi.fn();
      const unsub = manager.subscribe('task1', listener);
      unsub();
      manager.publish('task1', 'chunk', { content: 'after' });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('should do nothing for unknown taskId', () => {
      expect(() => manager.publish('unknown', 'chunk', {})).not.toThrow();
    });

    it('should push event to all subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      manager.subscribe('task1', listener1);
      manager.subscribe('task1', listener2);
      manager.publish('task1', 'done', { latencyMs: 100 });
      expect(listener1).toHaveBeenCalledWith({
        event: 'done',
        data: JSON.stringify({ latencyMs: 100 }),
      });
      expect(listener2).toHaveBeenCalledWith({
        event: 'done',
        data: JSON.stringify({ latencyMs: 100 }),
      });
    });

    it('should store event in cache (stream must exist first)', () => {
      initTask('task1');
      manager.publish('task1', 'chunk', { content: 'cached' });
      expect(manager.getCachedEvents('task1')).toHaveLength(1);
    });
  });

  describe('complete', () => {
    it('should mark task as completed', () => {
      initTask('task1');
      manager.publish('task1', 'chunk', {});
      manager.complete('task1');
      expect(manager.isTaskCompleted('task1')).toBe(true);
    });

    it('should clear subscribers after completion', () => {
      const listener = vi.fn();
      manager.subscribe('task1', listener);
      manager.complete('task1');
      manager.publish('task1', 'chunk', {});
      expect(listener).not.toHaveBeenCalled();
    });

    it('should replay all events for late subscriber after completion', () => {
      initTask('task1');
      manager.publish('task1', 'chunk', { content: 'data' });
      manager.complete('task1');
      const listener = vi.fn();
      manager.subscribe('task1', listener);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should not throw for unknown task', () => {
      expect(() => manager.complete('unknown')).not.toThrow();
    });

    it('should schedule cleanup after 5 minutes', () => {
      initTask('task1');
      manager.publish('task1', 'chunk', {});
      manager.complete('task1');
      expect(manager.getCachedEvents('task1')).toHaveLength(1);
      // Advance 5 minutes + 1 second
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
      expect(manager.getCachedEvents('task1')).toHaveLength(0);
    });
  });

  describe('isTaskCompleted', () => {
    it('should return false for non-existent task', () => {
      expect(manager.isTaskCompleted('ghost')).toBe(false);
    });

    it('should return false for active task', () => {
      manager.subscribe('task1', vi.fn());
      expect(manager.isTaskCompleted('task1')).toBe(false);
    });
  });

  describe('getCachedEvents', () => {
    it('should return empty array for unknown task', () => {
      expect(manager.getCachedEvents('ghost')).toEqual([]);
    });

    it('should return all cached events', () => {
      initTask('task1');
      manager.publish('task1', 'chunk', { content: '1' });
      manager.publish('task1', 'chunk', { content: '2' });
      const events = manager.getCachedEvents('task1');
      expect(events).toHaveLength(2);
    });

    it('should return cached events after completion (before cleanup)', () => {
      initTask('task1');
      manager.publish('task1', 'chunk', { content: 'persist' });
      manager.complete('task1');
      expect(manager.getCachedEvents('task1')).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple tasks independently', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      manager.subscribe('task1', listener1);
      manager.subscribe('task2', listener2);
      manager.publish('task1', 'chunk', { content: 'only task1' });
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should handle publish with no data fields gracefully', () => {
      const listener = vi.fn();
      manager.subscribe('task1', listener);
      manager.publish('task1', 'event', {});
      expect(listener).toHaveBeenCalledWith({
        event: 'event',
        data: JSON.stringify({}),
      });
    });
  });
});
