import { describe, it, expect } from 'vitest';
import { FREE_MODELS } from '@/config/freeModels';

describe('FREE_MODELS', () => {
  it('should have at least 5 models', () => {
    expect(FREE_MODELS.length).toBeGreaterThanOrEqual(5);
  });

  it('each model should have required fields', () => {
    for (const model of FREE_MODELS) {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.icon).toBeTruthy();
      expect(model.description).toBeTruthy();
      expect(Array.isArray(model.tags)).toBe(true);
      expect(typeof model.port).toBe('number');
      expect(model.modelId).toBeTruthy();
    }
  });

  it('should have unique ids', () => {
    const ids = FREE_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have unique ports', () => {
    const ports = FREE_MODELS.map((m) => m.port);
    expect(new Set(ports).size).toBe(ports.length);
  });

  it('each model id should be a kebab-case string ending with -free', () => {
    for (const model of FREE_MODELS) {
      expect(model.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*-free$/);
    }
  });

  it('each model should have at least one tag', () => {
    for (const model of FREE_MODELS) {
      expect(model.tags.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('ports should be in a reasonable range (8000-8100)', () => {
    for (const model of FREE_MODELS) {
      expect(model.port).toBeGreaterThanOrEqual(8000);
      expect(model.port).toBeLessThanOrEqual(8100);
    }
  });
});
