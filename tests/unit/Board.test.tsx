// tests/unit/Board.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Board } from '../../src/components/Board';
import { useGameStore } from '../../src/store/useGameStore';

beforeEach(() => {
  localStorage.clear();
  useGameStore.getState().reset();
  useGameStore.getState().startLevel(1);
});

describe('Board', () => {
  it('渲染所有瓶子', () => {
    const { container } = render(<Board />);
    expect(container.querySelectorAll('.bottle').length).toBe(useGameStore.getState().state.bottles.length);
  });

  it('点击瓶子触发 select', () => {
    const { container } = render(<Board />);
    const bottles = container.querySelectorAll('.bottle');
    fireEvent.click(bottles[0]!);
    expect(useGameStore.getState().state.selected).toBe(0);
  });
});
