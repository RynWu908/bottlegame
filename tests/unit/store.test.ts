// tests/unit/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/store/useGameStore';

beforeEach(() => {
  localStorage.clear();
  useGameStore.getState().reset();
});

describe('useGameStore', () => {
  it('startLevel 设置当前关', () => {
    useGameStore.getState().startLevel(1);
    expect(useGameStore.getState().currentLevel?.id).toBe(1);
    expect(useGameStore.getState().state.bottles).toHaveLength(3);
  });

  it('select 倒水后 moves 增加', () => {
    useGameStore.getState().startLevel(1);
    useGameStore.getState().select(0);
    useGameStore.getState().select(2);
    expect(useGameStore.getState().state.moves).toBe(1);
  });

  it('openAssist 弹口算题，pendingAssist 设置', () => {
    useGameStore.getState().startLevel(1);
    useGameStore.getState().openAssist('undo');
    expect(useGameStore.getState().isMathQuizOpen).toBe(true);
    expect(useGameStore.getState().pendingAssist).toBe('undo');
  });

  it('答对题执行 undo 并消耗额度', () => {
    useGameStore.getState().startLevel(1);
    useGameStore.getState().select(0);
    useGameStore.getState().select(2); // 倒水
    useGameStore.getState().openAssist('undo');
    useGameStore.getState().onQuizPassed();
    expect(useGameStore.getState().state.undosUsed).toBe(1);
    expect(useGameStore.getState().state.moves).toBe(0);
    expect(useGameStore.getState().isMathQuizOpen).toBe(false);
  });

  it('答对加空瓶，瓶子数+1', () => {
    useGameStore.getState().startLevel(1);
    const before = useGameStore.getState().state.bottles.length;
    useGameStore.getState().openAssist('addEmptyBottle');
    useGameStore.getState().onQuizPassed();
    expect(useGameStore.getState().state.bottles.length).toBe(before + 1);
  });

  it('通关后保存进度解锁下一关', () => {
    useGameStore.getState().startLevel(1);
    // 模拟胜利
    useGameStore.setState(s => ({ ...s, state: { ...s.state, status: 'won' } }));
    useGameStore.getState().save();
    const raw = localStorage.getItem('bottle-game:v1');
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw!);
    expect(saved.progress.unlockedLevelId).toBe(2);
  });
});
