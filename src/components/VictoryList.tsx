// src/components/VictoryList.tsx
import type { CSSProperties } from 'react';
import { useGameStore } from '../store/useGameStore';
import { soundEngine } from '../game/sound';

/** @brief 战绩列表：展示历史通关记录（最新在前） */
interface Props {
    onBack: () => void;
}
export function VictoryList({ onBack }: Props) {
    const history = useGameStore(s => s.saveData.victoryHistory);
    const reversed = [...history].reverse();

    function handleBack() {
        soundEngine.play('click');
        onBack();
    }

    return (
        <div className="page">
            <div className="victory-list">
                <button className="jelly-btn" onClick={handleBack}>← 返回</button>
                <h2>战绩</h2>
                {reversed.length === 0 ? (
                    <p className="victory-list__empty">还没有通关记录，快去挑战吧！</p>
                ) : (
                    <div className="victory-list__items">
                        {reversed.map((e, i) => (
                            <div key={i} className="victory-list__item" style={{ '--i': i } as CSSProperties}>
                                <span className="victory-list__level">第 {e.levelId} 关</span>
                                <span className="victory-list__stars">{'★'.repeat(e.stars)}{'☆'.repeat(3 - e.stars)}</span>
                                <span className="victory-list__moves">{e.moves} 步</span>
                                <span className="victory-list__time">{Math.floor(e.timeMs / 1000)}秒</span>
                                <span className="victory-list__date">{formatDate(e.date)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/** @brief ISO 日期字符串格式化为短显示 */
function formatDate(iso: string): string {
    const d = new Date(iso);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${m}/${day} ${h}:${min}`;
}
