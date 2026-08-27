// src/components/LevelSelect.tsx
import type { CSSProperties } from 'react';
import { LEVELS } from '../game/levels';
import { soundEngine } from '../game/sound';

/** @brief 关卡选择页：grid 展示全部关卡，自由选择任意关卡 */
interface Props {
    unlockedId: number;
    onSelect: (id: number) => void;
    onBack: () => void;
}
export function LevelSelect({ onSelect, onBack }: Props) {
    function handleBack() {
        soundEngine.play('click');
        onBack();
    }

    function handleSelect(id: number) {
        soundEngine.resume();
        soundEngine.play('click');
        onSelect(id);
    }

    return (
        <div className="page">
            <div className="level-select">
                <button className="jelly-btn" onClick={handleBack}>← 返回</button>
                <div className="level-select__grid">
                    {LEVELS.map((lv, i) => (
                        <button
                            key={lv.id}
                            onClick={() => handleSelect(lv.id)}
                            style={{ '--i': i } as CSSProperties}
                        >
                            {lv.id}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
