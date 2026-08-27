// src/components/Board.tsx
import { useGameStore } from '../store/useGameStore';
import { Bottle } from './Bottle';
import { COLOR_THEMES } from '../game/levels';
import { soundEngine } from '../game/sound';
import { useState } from 'react';
import type { Bottle as BottleData, ColorTheme } from '../game/types';
import '../styles/responsive.css';

/**
 * @brief 棋盘组件：从 useGameStore 读 state，把每个 bottle 映射为 Bottle 组件并渲染网格
 * @desc 承担颜色 ID → CSS 色值解析、非法操作抖动、成功倒水珠动画与音效
 */
export function Board() {
    const state = useGameStore(s => s.state);
    const difficulty = state.difficulty;
    const theme = COLOR_THEMES[difficulty] ?? COLOR_THEMES[1]!;
    const select = useGameStore(s => s.select);
    const [shakeIdx, setShakeIdx] = useState<number | null>(null);
    const [pouringIdx, setPouringIdx] = useState<number | null>(null);

    function handleClick(i: number) {
        const before = useGameStore.getState().state;
        const beforeSelected = before.selected;
        const beforeBottles = before.bottles.map(b => b.layers.length);

        // 用户手势内解锁 AudioContext
        soundEngine.resume();

        select(i);

        // 延迟到状态更新后判断操作结果
        setTimeout(() => {
            const after = useGameStore.getState().state;

            if (beforeSelected === null) {
                // 选中瓶子
                if (after.selected === i) {
                    soundEngine.play('select');
                }
                // 点空瓶：无变化，静默
            } else if (beforeSelected === i) {
                // 同瓶取消选中
                if (after.selected === null) {
                    soundEngine.play('click');
                }
            } else {
                // 尝试从 beforeSelected → i 倒水
                const afterBottles = after.bottles.map(b => b.layers.length);
                const changed = !beforeBottles.every((v, idx) => v === afterBottles[idx]);
                if (changed) {
                    // 成功倒水：播放倒水音 + 源瓶水珠动画
                    soundEngine.play('pour');
                    setPouringIdx(beforeSelected);
                    setTimeout(() => setPouringIdx(null), 500);
                } else {
                    // 非法操作：抖动 + 错误音
                    soundEngine.play('wrong');
                    setShakeIdx(i);
                    setTimeout(() => setShakeIdx(null), 300);
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
                    pouring={pouringIdx === i}
                    difficulty={difficulty}
                    onClick={() => handleClick(i)}
                />
            ))}
        </div>
    );
}

/**
 * @brief 把 bottle.layers 中的 ColorId 替换为 theme 中对应的 CSS 色值
 */
function resolveColors(b: BottleData, theme: ColorTheme): BottleData {
    return { ...b, layers: b.layers.map(c => theme[c] ?? c) };
}
