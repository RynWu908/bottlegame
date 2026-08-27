// tests/unit/generator.test.ts
import { describe, it, expect } from 'vitest';
import { generateLevel, RANDOM_PRESETS } from '../../src/game/generator';
import { solve } from '../../src/game/solver';

describe('generator', () => {
  it('简单档生成可解关卡', () => {
    const level = generateLevel(RANDOM_PRESETS[1], 1);
    expect(level.difficulty).toBe(1);
    expect(solve(level.bottles)).not.toBeNull();
    expect(level.bottles).toHaveLength(4);
  });

  it('中等档生成可解关卡', () => {
    const level = generateLevel(RANDOM_PRESETS[2], 1);
    expect(solve(level.bottles)).not.toBeNull();
  });

  it('困难档生成可解关卡', () => {
    const level = generateLevel(RANDOM_PRESETS[5], 1);
    expect(solve(level.bottles)).not.toBeNull();
  });

  it('seed 复现', () => {
    const a = generateLevel(RANDOM_PRESETS[2], 7);
    const b = generateLevel(RANDOM_PRESETS[2], 7);
    expect(a).toEqual(b);
  });

  it('生成 100 个不同 seed 全可解', () => {
    for (let i = 0; i < 100; i++) {
      const level = generateLevel(RANDOM_PRESETS[2], i);
      const sol = solve(level.bottles);
      expect(sol).not.toBeNull();
    }
  });
});
