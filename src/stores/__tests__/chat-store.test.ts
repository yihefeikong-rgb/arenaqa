import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '@/stores/chat-store';

beforeEach(() => {
  useChatStore.setState({
    status: 'idle',
    selectedModels: [],
    answers: {},
    scores: [],
    fusion: null,
    taskId: null,
    lastPrompt: '',
  });
});

describe('ChatStore', () => {
  describe('selectModel', () => {
    it('should add a model to selectedModels', () => {
      useChatStore.getState().selectModel('deepseek');
      expect(useChatStore.getState().selectedModels).toEqual(['deepseek']);
    });

    it('should not add duplicate models', () => {
      const store = useChatStore.getState();
      store.selectModel('deepseek');
      store.selectModel('deepseek');
      expect(useChatStore.getState().selectedModels).toEqual(['deepseek']);
    });

    it('should enforce maximum 6 models', () => {
      const store = useChatStore.getState();
      store.selectModel('a');
      store.selectModel('b');
      store.selectModel('c');
      store.selectModel('d');
      store.selectModel('e');
      store.selectModel('f');
      store.selectModel('g'); // should be rejected
      expect(useChatStore.getState().selectedModels.length).toBe(6);
    });

    it('should allow selecting up to 6 models', () => {
      const store = useChatStore.getState();
      for (let i = 0; i < 6; i++) {
        store.selectModel(`model-${i}`);
      }
      expect(useChatStore.getState().selectedModels.length).toBe(6);
    });
  });

  describe('deselectModel', () => {
    it('should remove a model from selectedModels', () => {
      useChatStore.setState({ selectedModels: ['deepseek', 'qwen'] });
      useChatStore.getState().deselectModel('deepseek');
      expect(useChatStore.getState().selectedModels).toEqual(['qwen']);
    });

    it('should do nothing if model not selected', () => {
      useChatStore.setState({ selectedModels: ['deepseek'] });
      useChatStore.getState().deselectModel('nonexistent');
      expect(useChatStore.getState().selectedModels).toEqual(['deepseek']);
    });
  });

  describe('setStatus', () => {
    it('should update status', () => {
      useChatStore.getState().setStatus('streaming');
      expect(useChatStore.getState().status).toBe('streaming');
      useChatStore.getState().setStatus('complete');
      expect(useChatStore.getState().status).toBe('complete');
    });
  });

  describe('appendChunk', () => {
    it('should append content to a model answer', () => {
      useChatStore.setState({ answers: { deepseek: { model: 'deepseek', content: '', status: 'streaming' } } });
      useChatStore.getState().appendChunk('deepseek', 'Hello ');
      useChatStore.getState().appendChunk('deepseek', 'World');
      expect(useChatStore.getState().answers['deepseek'].content).toBe('Hello World');
    });

    it('should create answer entry if it does not exist', () => {
      useChatStore.getState().appendChunk('new-model', 'chunk');
      expect(useChatStore.getState().answers['new-model'].content).toBe('chunk');
    });

    it('should preserve other fields when appending', () => {
      useChatStore.setState({ answers: { deepseek: { model: 'deepseek', content: 'start', status: 'streaming' } } });
      useChatStore.getState().appendChunk('deepseek', '+more');
      expect(useChatStore.getState().answers['deepseek'].status).toBe('streaming');
    });
  });

  describe('setAnswerDone', () => {
    it('should mark answer as done with latency', () => {
      useChatStore.setState({ answers: { deepseek: { model: 'deepseek', content: 'text', status: 'streaming' } } });
      useChatStore.getState().setAnswerDone('deepseek', 1234);
      const answer = useChatStore.getState().answers['deepseek'];
      expect(answer.status).toBe('done');
      expect(answer.latencyMs).toBe(1234);
    });

    it('should create answer entry if missing', () => {
      useChatStore.getState().setAnswerDone('new-model', 500);
      const answer = useChatStore.getState().answers['new-model'];
      expect(answer.status).toBe('done');
      expect(answer.latencyMs).toBe(500);
    });
  });

  describe('setAnswerError', () => {
    it('should mark answer as error with message', () => {
      useChatStore.setState({ answers: { deepseek: { model: 'deepseek', content: 'text', status: 'streaming' } } });
      useChatStore.getState().setAnswerError('deepseek', 'API timeout');
      const answer = useChatStore.getState().answers['deepseek'];
      expect(answer.status).toBe('error');
      expect(answer.error).toBe('API timeout');
    });
  });

  describe('stopModel', () => {
    it('should mark answer as stopped', () => {
      useChatStore.setState({ answers: { deepseek: { model: 'deepseek', content: 'partial', status: 'streaming' } } });
      useChatStore.getState().stopModel('deepseek');
      expect(useChatStore.getState().answers['deepseek'].status).toBe('stopped');
    });
  });

  describe('setScores / setFusion / setTaskId', () => {
    it('should set scores', () => {
      const scores = [{ model: 'deepseek', accuracy: 8, completeness: 7, actionability: 9, safety: 10, total: 8.5, brief: 'good' }];
      useChatStore.getState().setScores(scores);
      expect(useChatStore.getState().scores).toEqual(scores);
    });

    it('should set fusion', () => {
      const fusion = { consensus: ['point'], divergences: [], synthesized: 'text' };
      useChatStore.getState().setFusion(fusion);
      expect(useChatStore.getState().fusion).toEqual(fusion);
    });

    it('should set taskId', () => {
      useChatStore.getState().setTaskId('task_123');
      expect(useChatStore.getState().taskId).toBe('task_123');
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', () => {
      useChatStore.setState({
        status: 'complete',
        selectedModels: ['deepseek'],
        answers: { deepseek: { model: 'deepseek', content: 'text', status: 'done' } },
        scores: [{ model: 'deepseek', accuracy: 8, completeness: 7, actionability: 9, safety: 10, total: 8.5, brief: 'good' }],
        fusion: { consensus: ['point'], divergences: [], synthesized: 'text' },
        taskId: 'task_123',
      });
      useChatStore.getState().reset();
      const state = useChatStore.getState();
      expect(state.status).toBe('idle');
      expect(state.answers).toEqual({});
      expect(state.scores).toEqual([]);
      expect(state.fusion).toBeNull();
      expect(state.taskId).toBeNull();
    });
  });

  describe('state transitions', () => {
    it('should maintain lastPrompt separately', () => {
      useChatStore.setState({ lastPrompt: 'hello' });
      expect(useChatStore.getState().lastPrompt).toBe('hello');
    });
  });
});
