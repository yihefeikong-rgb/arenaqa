import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildFusionPrompt, parseFusionResponse } from '@/lib/fusion';

const { mockGenerateText } = vi.hoisted(() => ({
  mockGenerateText: vi.fn(),
}));

vi.mock('ai', () => ({
  generateText: mockGenerateText,
}));

const { runFusion } = await import('@/lib/fusion');

describe('fusion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe('buildFusionPrompt', () => {
    const answers = [
      { model: 'deepseek', content: 'DeepSeek says X' },
      { model: 'qwen', content: 'Qwen says Y' },
    ];

    it('should include the user prompt', () => {
      const prompt = buildFusionPrompt('What is AI?', answers);
      expect(prompt).toContain('What is AI?');
    });

    it('should include all model answers', () => {
      const prompt = buildFusionPrompt('Test', answers);
      expect(prompt).toContain('deepseek');
      expect(prompt).toContain('DeepSeek says X');
      expect(prompt).toContain('qwen');
      expect(prompt).toContain('Qwen says Y');
    });

    it('should mention consensus, divergences, and synthesis', () => {
      const prompt = buildFusionPrompt('Test', answers);
      expect(prompt).toContain('共识');
      expect(prompt).toContain('分歧');
      expect(prompt).toContain('综合');
    });

    it('should request JSON output format', () => {
      const prompt = buildFusionPrompt('Test', answers);
      expect(prompt).toContain('JSON');
    });

    it('should handle empty answers', () => {
      const prompt = buildFusionPrompt('Test', []);
      expect(prompt).toBeTruthy();
    });
  });

  describe('parseFusionResponse', () => {
    it('should parse valid JSON', () => {
      const validFusion = {
        consensus: ['Point A', 'Point B'],
        divergences: [
          { topic: 'Topic', positions: { deepseek: 'X', qwen: 'Y' } },
        ],
        synthesized: '# Final\nAnswer',
      };
      const result = parseFusionResponse(JSON.stringify(validFusion), [{ model: 'deepseek', content: 'X' }]);
      expect(result.consensus).toEqual(['Point A', 'Point B']);
      expect(result.divergences).toHaveLength(1);
      expect(result.divergences[0].topic).toBe('Topic');
      expect(result.synthesized).toBe('# Final\nAnswer');
    });

    it('should extract JSON wrapped in markdown code block', () => {
      const validFusion = { consensus: ['A'], divergences: [], synthesized: 'Text' };
      const md = '```json\n' + JSON.stringify(validFusion) + '\n```';
      const result = parseFusionResponse(md, [{ model: 'deepseek', content: 'X' }]);
      expect(result.consensus).toEqual(['A']);
    });

    it('should fallback to simple concatenation on parse failure', () => {
      const result = parseFusionResponse('not json', [
        { model: 'deepseek', content: 'Hello' },
        { model: 'qwen', content: 'World' },
      ]);
      expect(result.consensus[0]).toBe('融合解析失败，以下为原始回答');
      expect(result.synthesized).toContain('deepseek');
      expect(result.synthesized).toContain('Hello');
    });

    it('should handle empty divergences', () => {
      const json = JSON.stringify({ consensus: ['Only'], divergences: [], synthesized: 'Text' });
      const result = parseFusionResponse(json, [{ model: 'deepseek', content: 'X' }]);
      expect(result.divergences).toEqual([]);
    });

    it('should handle missing synthesized field as empty string', () => {
      const json = JSON.stringify({ consensus: ['A'], divergences: [] });
      const result = parseFusionResponse(json, [{ model: 'deepseek', content: 'X' }]);
      expect(result.synthesized).toBe('');
    });

    it('should handle empty consensus gracefully', () => {
      const json = JSON.stringify({ consensus: [], divergences: [], synthesized: 'Hi' });
      const result = parseFusionResponse(json, [{ model: 'deepseek', content: 'X' }]);
      expect(result.consensus).toEqual([]);
    });
  });

  describe('runFusion', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should skip fusion when no API key configured', async () => {
      vi.stubEnv('OPENAI_API_KEY', '');
      const answers = [{ model: 'deepseek', content: 'test' }];
      const result = await runFusion('task1', 'Hi', answers);
      expect(result.consensus[0]).toContain('OPENAI_API_KEY');
    });

    it('should skip fusion with single model', async () => {
      vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');
      const answers = [{ model: 'deepseek', content: 'test' }];
      const result = await runFusion('task1', 'Hi', answers);
      expect(result.consensus[0]).toBe('仅有一个模型回答，无需融合');
      expect(result.synthesized).toBe('test');
    });

    it('should handle empty answers (single model skip)', async () => {
      vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');
      const result = await runFusion('task1', 'Hi', []);
      expect(result.consensus[0]).toBe('仅有一个模型回答，无需融合');
    });

    it('should fallback on fusion error gracefully', async () => {
      vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');
      mockGenerateText.mockRejectedValueOnce(new Error('API Error'));
      const answers = [
        { model: 'deepseek', content: 'A' },
        { model: 'qwen', content: 'B' },
      ];
      const result = await runFusion('task1', 'Hi', answers);
      expect(result.consensus[0]).toBe('融合引擎调用失败');
    });

    it('should call generateText with 2+ models and key configured', async () => {
      vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');
      mockGenerateText.mockResolvedValueOnce({
        text: JSON.stringify({ consensus: ['A'], divergences: [], synthesized: 'Ok' }),
      });
      const answers = [
        { model: 'deepseek', content: 'X' },
        { model: 'qwen', content: 'Y' },
      ];
      const result = await runFusion('task1', 'Hi', answers);
      expect(mockGenerateText).toHaveBeenCalledOnce();
      expect(result.consensus).toEqual(['A']);
    });
  });
});
