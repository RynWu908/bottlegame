// src/components/VictoryOverlay.tsx
import { useEffect, useMemo, type CSSProperties } from 'react';
import { soundEngine } from '../game/sound';

/**
 * @brief 过关庆祝层：覆盖于游戏之上，展示星数、纸屑动画与操作按钮
 * @desc visible=false 时返回 null；首次 visible 时播放胜利音效
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

const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8DADC', '#9B5DE5', '#F15BB5'] as const;

export function VictoryOverlay({ visible, stars, onNext, onRetry }: Props) {
    // 首次可见时播放胜利音效
    useEffect(() => {
        if (visible) {
            soundEngine.resume();
            soundEngine.play('victory');
        }
    }, [visible]);

    // 纸屑数据仅在首次可见时生成一次
    const confetti = useMemo(() => {
        if (!visible) return [];
        return Array.from({ length: 32 }, (_, i) => ({
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
            left: `${(i / 32) * 100 + Math.random() * 3}%`,
            delay: `${Math.random() * 0.4}s`,
            duration: `${1.5 + Math.random() * 1.2}s`,
            dx: `${(Math.random() - 0.5) * 180}px`,
            rot: `${360 + Math.random() * 540}deg`,
        }));
    }, [visible]);

    if (!visible) return null;

    return (
        <div className="victory" role="dialog" aria-label="过关">
            <div className="confetti">
                {confetti.map((c, i) => (
                    <span
                        key={i}
                        className="confetti__piece"
                        style={{
                            left: c.left,
                            background: c.color,
                            animationDelay: c.delay,
                            animationDuration: c.duration,
                            '--dx': c.dx,
                            '--rot': c.rot,
                        } as CSSProperties}
                    />
                ))}
            </div>
            <div className="victory__card">
                <h2>过关！</h2>
                <div className="victory__stars">
                    {stars > 0
                        ? Array.from({ length: stars }, (_, i) => <span key={i}>⭐</span>)
                        : <span>☆</span>}
                </div>
                <div className="btn-group">
                    <button className="jelly-btn" onClick={() => { soundEngine.play('click'); onRetry(); }}>重玩</button>
                    <button className="jelly-btn jelly-btn--primary" onClick={() => { soundEngine.play('click'); onNext(); }}>下一关</button>
                </div>
            </div>
        </div>
    );
}
