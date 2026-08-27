// tests/unit/reducer.test.ts
import { describe, it, expect } from 'vitest';
import { createInitialState, reducer } from '../../src/game/reducer';
import type { Level } from '../../src/game/types';

const level: Level = {
  id: 1,
  par: 3,
  difficulty: 1,
  bottles: [
    { id: 0, capacity: 4, layers: ['c1', 'c1', 'c2', 'c2'] },
    { id: 1, capacity: 4, layers: ['c2', 'c1', 'c1', 'c2'] },
    { id: 2, capacity: 4, layers: [] },
  ],
};

describe('reducer — select action', () => {
  it('选中第一个瓶子时设置 selected', () => {
    const state = createInitialState(level);
    const next = reducer(state, { type: 'select', index: 0 });
    expect(next.selected).toBe(0);
  });

  it('再次点同一个瓶子取消选中', () => {
    const state = reducer(createInitialState(level), { type: 'select', index: 0 });
    const next = reducer(state, { type: 'select', index: 0 });
    expect(next.selected).toBeNull();
  });
});

describe('reducer — select then pour', () => {
  it('选中 A 后点 B，A 顶段同色倒入 B', () => {
    const level2: Level = {
      id: 2,
      par: 1,
      difficulty: 1,
      bottles: [
        { id: 0, capacity: 4, layers: ['c1', 'c1'] },
        { id: 1, capacity: 4, layers: ['c1', 'c1'] },
        { id: 2, capacity: 4, layers: [] },
      ],
    };
    let state = createInitialState(level2);
    state = reducer(state, { type: 'select', index: 0 });
    state = reducer(state, { type: 'select', index: 2 });
    // A 顶段是 'c1'，B 空，倒 2 段
    expect(state.bottles[0]!.layers).toEqual([]);
    expect(state.bottles[2]!.layers).toEqual(['c1', 'c1']);
    expect(state.moves).toBe(1);
    expect(state.history).toHaveLength(1);
  });

  it('非法倒水（顶段不同色）保留选中态、moves 不变', () => {
    let state = createInitialState(level);
    state = reducer(state, { type: 'select', index: 0 });
    state = reducer(state, { type: 'select', index: 1 });
    expect(state.selected).toBe(0); // 保留选中 A
    expect(state.moves).toBe(0);
  });

  it('满瓶不可倒入', () => {
    let state = createInitialState(level);
    state = reducer(state, { type: 'select', index: 0 });
    state = reducer(state, { type: 'select', index: 1 });
    expect(state.moves).toBe(0);
    expect(state.bottles[0]!.layers).toEqual(['c1', 'c1', 'c2', 'c2']);
  });
});
