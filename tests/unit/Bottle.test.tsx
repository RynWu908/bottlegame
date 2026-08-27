// tests/unit/Bottle.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Bottle } from '../../src/components/Bottle';
import type { Bottle as BottleData } from '../../src/game/types';

const bottle: BottleData = { id: 0, capacity: 4, layers: ['c1', 'c1', 'c2', 'c2'] };

describe('Bottle component', () => {
  it('渲染瓶子容器与液体 SVG', () => {
    const { container } = render(<Bottle bottle={bottle} selected={false} difficulty={1} onClick={() => {}} />);
    expect(container.querySelector('.bottle')).toBeTruthy();
    expect(container.querySelector('.bottle__liquid')).toBeTruthy();
    expect(container.querySelectorAll('svg path').length).toBeGreaterThan(0);
  });

  it('selected 时有 .selected 类', () => {
    const { container } = render(<Bottle bottle={bottle} selected={true} difficulty={1} onClick={() => {}} />);
    expect(container.querySelector('.bottle.selected')).toBeTruthy();
  });

  it('点击触发 onClick', () => {
    let clicked = 0;
    const { container } = render(<Bottle bottle={bottle} selected={false} difficulty={1} onClick={() => clicked++} />);
    (container.querySelector('.bottle') as HTMLElement).click();
    expect(clicked).toBe(1);
  });
});
