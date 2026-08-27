// tests/unit/reducer.test.ts
import { describe, it, expect } from 'vitest';
import { createInitialState, reducer, checkVictory } from '../../src/game/reducer';
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

describe('reducer — victory', () => {
  it('全部瓶子单色满或空时 status=won', () => {
    const winLevel: Level = {
      id: 99,
      par: 1,
      difficulty: 1,
      bottles: [
        { id: 0, capacity: 2, layers: ['c1', 'c1'] },
        { id: 1, capacity: 2, layers: ['c2', 'c2'] },
      ],
    };
    const state = createInitialState(winLevel);
    // 已是胜利终态
    const checked = checkVictory(state);
    expect(checked.status).toBe('won');
  });
});

describe('reducer — undo', () => {
  it('撤销回退一步，moves-1，emptyBottlesAdded 不变', () => {
    const level2: Level = {
      id: 2,
      par: 1,
      difficulty: 1,
      bottles: [
        { id: 0, capacity: 4, layers: ['c1', 'c1'] },
        { id: 1, capacity: 4, layers: [] },
      ],
    };
    let state = createInitialState(level2);
    state = reducer(state, { type: 'select', index: 0 });
    state = reducer(state, { type: 'select', index: 1 });
    expect(state.moves).toBe(1);
    state = reducer(state, { type: 'undo' });
    expect(state.moves).toBe(0);
    expect(state.bottles[0]!.layers).toEqual(['c1', 'c1']);
    expect(state.bottles[1]!.layers).toEqual([]);
    expect(state.undosUsed).toBe(1);
  });

  it('undosUsed 达上限不再撤销', () => {
    const level2: Level = {
      id: 2,
      par: 1,
      difficulty: 1,
      bottles: [
        { id: 0, capacity: 4, layers: ['c1', 'c1'] },
        { id: 1, capacity: 4, layers: ['c1', 'c1'] },
        { id: 2, capacity: 4, layers: [] },
        { id: 3, capacity: 4, layers: [] },
      ],
    };
    let state = createInitialState(level2);
    // 倒水 3 次，制造 3 步历史
    state = reducer(state, { type: 'select', index: 0 });
    state = reducer(state, { type: 'select', index: 2 });
    state = reducer(state, { type: 'select', index: 1 });
    state = reducer(state, { type: 'select', index: 3 });
    state = reducer(state, { type: 'select', index: 2 });
    state = reducer(state, { type: 'select', index: 0 });
    // 撤销 3 次（达上限）
    for (let i = 0; i < 3; i++) {
      state = reducer(state, { type: 'undo' });
    }
    expect(state.undosUsed).toBe(3);
    // 达上限后再撤销无效
    const before = state;
    state = reducer(state, { type: 'undo' });
    expect(state).toBe(before);
  });
});

describe('reducer — addEmptyBottle', () => {
  it('加一个空瓶到棋盘末尾，emptyBottlesAdded+1，moves 不变', () => {
    let state = createInitialState(level);
    state = reducer(state, { type: 'addEmptyBottle' });
    expect(state.bottles).toHaveLength(4);
    expect(state.bottles[3]!.layers).toEqual([]);
    expect(state.bottles[3]!.capacity).toBe(4);
    expect(state.emptyBottlesAdded).toBe(1);
    expect(state.moves).toBe(0);
  });

  it('达上限后加空瓶无效', () => {
    let state = createInitialState(level);
    state = reducer(state, { type: 'addEmptyBottle' });
    const before = state;
    state = reducer(state, { type: 'addEmptyBottle' });
    expect(state).toBe(before);
  });
});
