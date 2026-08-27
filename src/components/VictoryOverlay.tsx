// src/components/VictoryOverlay.tsx

/**
 * @brief 过关庆祝层：覆盖于游戏之上，展示星数与操作按钮
 * @desc visible=false 时直接 return null；stars=0 用 ☆ 兜底显示空星
 * @param visible: boolean | 是否显示
 * @param stars: 0|1|2|3 | 获得星数
 * @param onNext: () => void | 进入下一关回调
 * @param onRetry: () => void | 重玩当前关回调
 */
interface Props {
    visible: boolean;
    stars: 0 | 1 | 2 | 3;
    onNext: () => void;
    onRetry: () => void;
}

export function VictoryOverlay({ visible, stars, onNext, onRetry }: Props) {
    if (!visible) return null;
    return (
        <div className="victory" role="dialog" aria-label="过关">
            <div className="victory__card">
                <h2>过关！</h2>
                <div className="victory__stars">{'⭐'.repeat(stars) || '☆'}</div>
                <button onClick={onRetry}>重玩</button>
                <button onClick={onNext}>下一关</button>
            </div>
        </div>
    );
}
