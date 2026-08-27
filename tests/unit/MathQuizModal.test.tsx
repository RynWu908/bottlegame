// tests/unit/MathQuizModal.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

// 固定 generateQuestion 返回答案=3，避免依赖随机 seed 预测
vi.mock('../../src/game/mathquiz', () => ({
    generateQuestion: () => ({
        question: '1 + 2',
        answer: 3,
        operands: [1, 2],
        operators: ['+'],
        display: '1 + 2 = ?',
    }),
}));

import { MathQuizModal } from '../../src/components/MathQuizModal';
import { useGameStore } from '../../src/store/useGameStore';

beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().reset();
    useGameStore.getState().startLevel(1);
});

describe('MathQuizModal', () => {
    it('未打开时不渲染', () => {
        const { container } = render(<MathQuizModal />);
        expect(container.querySelector('.quiz')).toBeNull();
    });

    it('打开后显示题目', () => {
        useGameStore.getState().openAssist('undo');
        const { container } = render(<MathQuizModal />);
        expect(container.querySelector('.quiz')).toBeTruthy();
        expect(container.textContent).toMatch(/\d+\s*[+\-×÷]\s*\d+/);
    });

    it('答对题关闭 modal 并执行辅助', () => {
        useGameStore.getState().openAssist('undo');
        // 先倒水让撤销有目标
        useGameStore.getState().select(0);
        useGameStore.getState().select(2);
        const { container } = render(<MathQuizModal />);
        const input = container.querySelector('input')!;
        fireEvent.change(input, { target: { value: '3' } });
        fireEvent.click(container.querySelector('button[data-test="submit"]')!);
        expect(useGameStore.getState().isMathQuizOpen).toBe(false);
    });

    it('答错输入抖动', () => {
        useGameStore.getState().openAssist('undo');
        const { container } = render(<MathQuizModal />);
        const input = container.querySelector('input')!;
        fireEvent.change(input, { target: { value: '99999' } });
        fireEvent.click(container.querySelector('button[data-test="submit"]')!);
        expect(container.querySelector('.quiz__input.shake')).toBeTruthy();
    });
});
