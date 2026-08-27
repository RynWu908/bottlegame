// src/components/Board.tsx
import { useGameStore } from '../store/useGameStore';
import { Bottle } from './Bottle';
import { COLOR_THEMES } from '../game/levels';
import { useState } from 'react';
import type { Bottle as BottleData, ColorTheme } from '../game/types';
import '../styles/responsive.css';

/**
 * @brief 棋盘组件：从 useGameStore 读 state，把每个 bottle 映射为 Bottle 组件并渲染网格
 * @desc 同时承担颜色 ID 到 CSS 色值的解析、非法操作的"抖动"反馈
 */
export function Board() {
    const state = useGameStore(s => s.state);
    const difficulty = state.difficulty;
    const theme = COLOR_THEMES[difficulty] ?? COLOR_THEMES[1]!;
    const select = useGameStore(s => s.select);
    const [shakeIdx, setShakeIdx] = useState<number | null>(null);

    function handleClick(i: number) {
        const before = useGameStore.getState().state.selected;
        const beforeBottles = useGameStore.getState().state.bottles.map(b => b.layers.length);
        select(i);
        // 检测是否非法：moves 不变且 selected 保留 → 抖动
        setTimeout(() => {
            const after = useGameStore.getState().state;
            if (after.moves === 0 && after.selected === before && before !== null) {
                // 可能是非法；进一步比较 bottles
                const afterBottles = after.bottles.map(b => b.layers.length);
                const same = beforeBottles.every((v, idx) => v === afterBottles[idx]);
                if (same) {
                    setShakeIdx(i);
                    setTimeout(() => setShakeIdx(null), 200);
                }
            }
        }, 0);
    }

    return (
        <div className="board">
            {state.bottles.map((b, i) => (
                <Bottle
                    key={b.id}
                    bottle={resolveColors(b, theme)}
                    selected={state.selected === i}
                    shake={shakeIdx === i}
                    difficulty={difficulty}
                    onClick={() => handleClick(i)}
                />
            ))}
        </div>
    );
}

/**
 * @brief 把 bottle.layers 中的 ColorId 替换为 theme 中对应的 CSS 色值
 * @desc Bottle 组件的 fill 直接收 CSS 颜色串；找不到映射时保留原值兜底
 */
function resolveColors(b: BottleData, theme: ColorTheme): BottleData {
    return { ...b, layers: b.layers.map(c => theme[c] ?? c) };
}
