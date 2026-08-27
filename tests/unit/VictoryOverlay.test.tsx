// tests/unit/VictoryOverlay.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VictoryOverlay } from '../../src/components/VictoryOverlay';

describe('VictoryOverlay', () => {
  it('won 时显示庆祝层', () => {
    const { getByText } = render(<VictoryOverlay visible={true} stars={3} onNext={() => {}} onRetry={() => {}} />);
    expect(getByText(/过关/)).toBeTruthy();
    expect(getByText('下一关')).toBeTruthy();
  });

  it('visible=false 不渲染', () => {
    const { container } = render(<VictoryOverlay visible={false} stars={0} onNext={() => {}} onRetry={() => {}} />);
    expect(container.querySelector('.victory')).toBeNull();
  });
});
