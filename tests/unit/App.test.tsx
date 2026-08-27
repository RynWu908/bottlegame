// tests/unit/App.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import App from '../../src/App';
import { useGameStore } from '../../src/store/useGameStore';

beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().reset();
    useGameStore.getState().loadProgress();
});

describe('App routing', () => {
    it('初始在菜单，点击开始进选择页', () => {
        const { getByText, getAllByText } = render(<App />);
        fireEvent.click(getByText('开始游戏'));
        // 选择页应出现关卡 1 按钮
        expect(getAllByText('1').length).toBeGreaterThan(0);
    });

    it('选关卡 1 进入游戏，显示棋盘', () => {
        const { getByText, getAllByText, container } = render(<App />);
        fireEvent.click(getByText('开始游戏'));
        fireEvent.click(getAllByText('1')[0]!);  // 关卡 1 按钮
        expect(container.querySelectorAll('.bottle').length).toBeGreaterThan(0);
    });
});
