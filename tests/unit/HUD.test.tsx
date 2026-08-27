// tests/unit/HUD.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { HUD } from '../../src/components/HUD';
import { useGameStore } from '../../src/store/useGameStore';

beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().reset();
    useGameStore.getState().startLevel(1);
});

describe('HUD', () => {
    it('显示步数与计时', () => {
        const { getByText } = render(<HUD onMenu={() => {}} />);
        expect(getByText(/步/)).toBeTruthy();
        expect(getByText(/秒/)).toBeTruthy();
    });

    it('点击撤销打开口算题 modal', () => {
        const { getByText } = render(<HUD onMenu={() => {}} />);
        fireEvent.click(getByText(/撤销/));
        expect(useGameStore.getState().isMathQuizOpen).toBe(true);
        expect(useGameStore.getState().pendingAssist).toBe('undo');
    });

    it('撤销额度用完按钮置灰', () => {
        // 先用 3 次撤销
        useGameStore.setState(s => ({ ...s, state: { ...s.state, undosUsed: 3 } }));
        const { getByText } = render(<HUD onMenu={() => {}} />);
        const btn = getByText(/撤销/).closest('button')!;
        expect(btn.disabled).toBe(true);
    });
});
