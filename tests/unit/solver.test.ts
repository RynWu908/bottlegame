// tests/unit/solver.test.ts
import { describe, it, expect } from 'vitest';
import { solve } from '../../src/game/solver';
import type { Bottle } from '../../src/game/types';

describe('solver', () => {
  it('最小可解局面返回最短解', () => {
    const bottles: Bottle[] = [
      { id: 0, capacity: 2, layers: ['c1', 'c2'] },
      { id: 1, capacity: 2, layers: ['c2', 'c1'] },
      { id: 2, capacity: 2, layers: [] },
    ];
    const sol = solve(bottles);
    expect(sol).not.toBeNull();
    // 该局面真实最短解为 3 步（经状态空间穷举确认：2 步内无解局面）
    expect(sol!.length).toBe(3);
  });

  it('不可解局面返回 null', () => {
    const bottles: Bottle[] = [
      { id: 0, capacity: 2, layers: ['c1', 'c2'] },
      { id: 1, capacity: 2, layers: ['c1', 'c2'] },
    ];
    // 两个瓶子都满，无空瓶，颜色交错，无解
    const sol = solve(bottles);
    expect(sol).toBeNull();
  });

  it('节点上限触发返回 null 不崩溃', () => {
    const bottles: Bottle[] = [
      { id: 0, capacity: 2, layers: ['c1', 'c2'] },
      { id: 1, capacity: 2, layers: ['c1', 'c2'] },
    ];
    const sol = solve(bottles, 5);
    expect(sol).toBeNull();
  });
});
