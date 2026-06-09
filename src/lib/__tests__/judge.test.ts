import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildJudgePrompt, parseJudgeResponse } from '@/lib/judge';

// vi.mock is hoisted; use vi.hoisted for the factory
const { mockGenerateText } = vi.hoisted(() => ({
  mockGenerateText: vi.fn().mockResolvedValue({ text: '[]' }),
}));

vi.mock('ai', () => ({
  generateText: mockGenerateText,
}));

const { runJudge } = await import('@/lib/judge');

describe('judge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe('buildJudgePrompt', () => {
    const answers = [
      { model: 'deepseek', content: 'Answer A' },
      { model: 'qwen', content: 'Answer B' },
    ];

    it('should include the user prompt', () => {
      const prompt = buildJudgePrompt('What is AI?', answers);
      expect(prompt).toContain('What is AI?');
    });

    it('should include all model answers', () => {
      const prompt = buildJudgePrompt('Test', answers);
      expect(prompt).toContain('deepseek');
      expect(prompt).toContain('Answer A');
      expect(prompt).toContain('qwen');
      expect(prompt).toContain('Answer B');
    });

    it('should mention all four scoring dimensions', () => {
      const prompt = buildJudgePrompt('Test', answers);
      expect(prompt).toContain('accuracy');
      expect(prompt).toContain('completeness');
      expect(prompt).toContain('actionability');
      expect(prompt).toContain('safety');
    });

    it('should request JSON output format', () => {
      const prompt = buildJudgePrompt('Test', answers);
      expect(prompt).toContain('JSON');
    });

    it('should handle empty answers array', () => {
      const prompt = buildJudgePrompt('Test', []);
      expect(prompt).toBeTruthy();
    });
  });

  describe('parseJudgeResponse', () => {
    const answers = [
      { model: 'deepseek', content: 'Answer A' },
      { model: 'qwen', content: 'Answer B' },
    ];

    it('should parse valid JSON response', () => {
      const json = JSON.stringify([
        { model: 'deepseek', accuracy: 8, completeness: 7, actionability: 9, safety: 10, total: 8.5, brief: 'Good' },
      ]);
      const result = parseJudgeResponse(json, answers);
      expect(result.scores).toHaveLength(1);
      expect(result.scores[0].model).toBe('deepseek');
      expect(result.scores[0].accuracy).toBe(8);
      expect(result.scores[0].total).toBe(8.5);
    });

    it('should extract JSON wrapped in markdown code block', () => {
      const md = '```json\n[{"model":"deepseek","accuracy":7,"completeness":8,"actionability":6,"safety":9,"total":7.5,"brief":"OK"}]\n```';
      const result = parseJudgeResponse(md, answers);
      expect(result.scores).toHaveLength(1);
      expect(result.scores[0].accuracy).toBe(7);
    });

    it('should fallback to zero scores on parse failure', () => {
      const result = parseJudgeResponse('not json at all', answers);
      expect(result.scores).toHaveLength(2);
      for (const s of result.scores) {
        expect(s.accuracy).toBe(0);
        expect(s.total).toBe(0);
      }
      expect(result.scores[0].brief).toBe('裁判评分解析失败');
    });

    it('should map scores to correct model names', () => {
      const json = JSON.stringify([
        { model: 'deepseek', accuracy: 9, completeness: 9, actionability: 9, safety: 9, total: 9, brief: 'A' },
        { model: 'qwen', accuracy: 5, completeness: 5, actionability: 5, safety: 5, total: 5, brief: 'B' },
      ]);
      const result = parseJudgeResponse(json, answers);
      expect(result.scores).toHaveLength(2);
      expect(result.scores[0].model).toBe('deepseek');
      expect(result.scores[1].model).toBe('qwen');
    });

    it('should handle empty JSON array', () => {
      const result = parseJudgeResponse('[]', []);
      expect(result.scores).toEqual([]);
    });
  });

  describe('runJudge', () => {
    const answers = [{ model: 'deepseek', content: 'Hello' }];

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return zero scores when no API key is provided', async () => {
      vi.stubEnv('OPENAI_API_KEY', '');
      const result = await runJudge('task1', 'Hi', answers, null);
      expect(result.scores).toHaveLength(1);
      expect(result.scores[0].total).toBe(0);
      expect(result.scores[0].brief).toContain('未配置');
    });

    it('should call generateText when API key is set', async () => {
      vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');
      mockGenerateText.mockResolvedValueOnce({
        text: JSON.stringify([{ model: 'deepseek', accuracy: 8, completeness: 7, actionability: 9, safety: 10, total: 8.5, brief: 'Good' }]),
      });
      const result = await runJudge('task1', 'Hi', answers, null);
      expect(mockGenerateText).toHaveBeenCalledOnce();
      expect(result.scores).toHaveLength(1);
      expect(result.scores[0].accuracy).toBe(8);
    });

    it('should handle empty answers array', async () => {
      vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');
      const result = await runJudge('task1', 'Hi', [], null);
      expect(mockGenerateText).toHaveBeenCalledOnce();
      expect(result.scores).toEqual([]);
    });
  });
});
