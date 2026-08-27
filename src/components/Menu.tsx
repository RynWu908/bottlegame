// src/components/Menu.tsx
import { soundEngine } from '../game/sound';

/** @brief 主菜单：标题 + 开始游戏 + 随机挑战按钮（仅当全部关卡解锁后显示） */
interface Props {
    onPlay: () => void;
    onRandom?: () => void;
}
export function Menu({ onPlay, onRandom }: Props) {
    function handlePlay() {
        soundEngine.resume();
        soundEngine.play('click');
        onPlay();
    }

    function handleRandom() {
        soundEngine.resume();
        soundEngine.play('click');
        onRandom?.();
    }

    return (
        <div className="page">
            <div className="menu">
                <h1>倒水瓶</h1>
                <button className="jelly-btn" onClick={handlePlay}>开始游戏</button>
                {onRandom && (
                    <button className="jelly-btn" onClick={handleRandom}>随机挑战</button>
                )}
            </div>
        </div>
    );
}
