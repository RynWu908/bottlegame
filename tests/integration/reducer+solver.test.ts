// tests/integration/reducer+solver.test.ts
import { describe, it, expect } from 'vitest';
import { reducer, createInitialState } from '../../src/game/reducer';
import { solve } from '../../src/game/solver';
import { LEVELS } from '../../src/game/levels';
import { generateLevel, RANDOM_PRESETS } from '../../src/game/generator';
import type { GameState, SolveStep } from '../../src/game/types';

describe('integration: reducer + solver', () => {
  it('用 reducer 重放 solver 算出的解能通关', () => {
    const level = LEVELS[0]!;
    const sol = solve(level.bottles);
    expect(sol).not.toBeNull();
    const finalState = applySteps(createInitialState(level), sol!);
    expect(finalState.status).toBe('won');
  });

  it('全部 50 关 solver 解都能在 reducer 走通', () => {
    for (const level of LEVELS) {
      const sol = solve(level.bottles);
      expect(sol).not.toBeNull();
      const finalState = applySteps(createInitialState(level), sol!);
      expect(finalState.status).toBe('won');
    }
  });

  it('10 个随机关卡 solver 解都能在 reducer 走通', () => {
    for (let i = 0; i < 10; i++) {
      const level = generateLevel(RANDOM_PRESETS[2], i);
      const sol = solve(level.bottles);
      expect(sol).not.toBeNull();
      const finalState = applySteps(createInitialState(level), sol!);
      expect(finalState.status).toBe('won');
    }
  });
});

function applySteps(state: GameState, steps: SolveStep[]): GameState {
  let s = state;
  for (const step of steps) {
    s = reducer(s, { type: 'select', index: step.from });
    s = reducer(s, { type: 'select', index: step.to });
  }
  return s;
}
