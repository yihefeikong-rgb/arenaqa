import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** Helper: clear all known API keys so no provider appears configured */
function clearAllApiKeys() {
  const keys = [
    'DEEPSEEK_API_KEY', 'QWEN_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY',
  ];
  for (const k of keys) vi.stubEnv(k, '');
}

describe('provider-registry', () => {
  describe('registerProvidersFromEnv', () => {
    it('should return model defs for configured providers', async () => {
      clearAllApiKeys();
      vi.stubEnv('DEEPSEEK_API_KEY', 'sk-ds-test');
      vi.stubEnv('QWEN_API_KEY', 'sk-qwen-test');

      const { registerProvidersFromEnv } = await import('@/lib/provider-registry');
      const defs = registerProvidersFromEnv();

      const deepseek = defs.find((d) => d.id === 'deepseek');
      expect(deepseek).toBeDefined();
      expect(deepseek!.configured).toBe(true);
      expect(deepseek!.displayName).toBe('DeepSeek V3');

      const qwen = defs.find((d) => d.id === 'qwen');
      expect(qwen).toBeDefined();
      expect(qwen!.configured).toBe(true);
    });

    it('should mark unconfigured providers as not configured', async () => {
      clearAllApiKeys();
      const { registerProvidersFromEnv } = await import('@/lib/provider-registry');
      const defs = registerProvidersFromEnv();

      const deepseek = defs.find((d) => d.id === 'deepseek');
      expect(deepseek).toBeDefined();
      expect(deepseek!.configured).toBe(false);
    });

    it('should include all standard models (deepseek, qwen, claude, gemini)', async () => {
      clearAllApiKeys();
      const { registerProvidersFromEnv } = await import('@/lib/provider-registry');
      const defs = registerProvidersFromEnv();

      const ids = defs.map((d) => d.id);
      expect(ids).toContain('deepseek');
      expect(ids).toContain('qwen');
      expect(ids).toContain('claude');
      expect(ids).toContain('gemini');
    });

    it('each def should have required fields', async () => {
      clearAllApiKeys();
      const { registerProvidersFromEnv } = await import('@/lib/provider-registry');
      const defs = registerProvidersFromEnv();

      for (const def of defs) {
        expect(def.id).toBeTruthy();
        expect(def.displayName).toBeTruthy();
        expect(def.providerType).toBeTruthy();
        expect(typeof def.configured).toBe('boolean');
      }
    });
  });

  describe('initializeProviders', () => {
    it('should return consistent model definitions across calls', async () => {
      clearAllApiKeys();
      vi.stubEnv('DEEPSEEK_API_KEY', 'sk-ds-test');

      const mod = await import('@/lib/provider-registry');
      const first = mod.initializeProviders();
      const second = mod.initializeProviders();

      expect(second.length).toBeGreaterThanOrEqual(1);
      expect(first.length).toBe(second.length); // same count, refreshed each call
    });
  });
});
