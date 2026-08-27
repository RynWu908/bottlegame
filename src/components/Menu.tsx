// src/components/Menu.tsx

/** @brief 主菜单：标题 + 开始游戏 + 随机挑战按钮（仅当全部关卡解锁后显示） */
interface Props {
    onPlay: () => void;
    onRandom?: () => void;
}
export function Menu({ onPlay, onRandom }: Props) {
    return (
        <div className="menu">
            <h1>倒水瓶</h1>
            <button onClick={onPlay}>开始游戏</button>
            {onRandom && <button onClick={onRandom}>随机挑战</button>}
        </div>
    );
}
