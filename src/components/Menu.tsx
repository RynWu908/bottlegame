// src/components/Menu.tsx
import { soundEngine } from '../game/sound';

/** @brief 主菜单：标题 + 开始游戏 + 战绩 + 随机挑战（全通关后显示） */
interface Props {
    onPlay: () => void;
    onRecords: () => void;
    onRandom?: () => void;
}
export function Menu({ onPlay, onRecords, onRandom }: Props) {
    function handlePlay() {
        soundEngine.resume();
        soundEngine.play('click');
        onPlay();
    }

    function handleRecords() {
        soundEngine.resume();
        soundEngine.play('click');
        onRecords();
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
                <button className="jelly-btn" onClick={handleRecords}>战绩</button>
                {onRandom && (
                    <button className="jelly-btn" onClick={handleRandom}>随机挑战</button>
                )}
            </div>
        </div>
    );
}
