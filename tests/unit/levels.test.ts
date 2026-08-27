// tests/unit/levels.test.ts
import { describe, it, expect } from 'vitest';
import { LEVELS, COLOR_THEMES } from '../../src/game/levels';
import { solve } from '../../src/game/solver';

describe('levels data', () => {
  it('关卡数 >= 50', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(50);
  });

  it('ID 连续 1..N', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      expect(LEVELS[i]!.id).toBe(i + 1);
    }
  });

  it('难度单调非减', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i]!.difficulty).toBeGreaterThanOrEqual(LEVELS[i - 1]!.difficulty);
    }
  });

  it('全部关卡可解', () => {
    for (const lv of LEVELS) {
      expect(solve(lv.bottles)).not.toBeNull();
    }
  });
});

describe('color themes', () => {
  it('难度 1/3/5 都有主题', () => {
    expect(COLOR_THEMES[1]).toBeDefined();
    expect(COLOR_THEMES[3]).toBeDefined();
    expect(COLOR_THEMES[5]).toBeDefined();
  });
});
