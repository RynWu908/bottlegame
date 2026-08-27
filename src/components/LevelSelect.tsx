// src/components/LevelSelect.tsx
import { LEVELS } from '../game/levels';

/** @brief 关卡选择页：grid 展示全部关卡，超过 unlockedId 的按钮置灰 */
interface Props {
    unlockedId: number;
    onSelect: (id: number) => void;
    onBack: () => void;
}
export function LevelSelect({ unlockedId, onSelect, onBack }: Props) {
    return (
        <div className="level-select">
            <button onClick={onBack}>← 返回</button>
            <div className="level-select__grid">
                {LEVELS.map(lv => (
                    <button
                        key={lv.id}
                        disabled={lv.id > unlockedId}
                        onClick={() => onSelect(lv.id)}
                    >
                        {lv.id}
                    </button>
                ))}
            </div>
        </div>
    );
}
