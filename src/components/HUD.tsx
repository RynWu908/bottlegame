// src/components/HUD.tsx
import { useGameStore } from '../store/useGameStore';
import { useTimer } from '../hooks/useTimer';
import { soundEngine } from '../game/sound';
import { ASSIST_LIMITS } from '../game/types';

/**
 * @brief 顶部 HUD：步数/计时 + 撤销/加空瓶/重置/主菜单按钮
 * @desc 撤销与加空瓶受 ASSIST_LIMITS 额度限制；按钮使用 jelly-btn 果冻触感
 */
interface Props {
    onMenu: () => void;
}

export function HUD({ onMenu }: Props) {
    useTimer();
    const state = useGameStore(s => s.state);
    const openAssist = useGameStore(s => s.openAssist);
    const reset = useGameStore(s => s.reset);
    const seconds = Math.floor(state.elapsedMs / 1000);

    const undoDisabled = state.undosUsed >= ASSIST_LIMITS.undo;
    const addDisabled = state.emptyBottlesAdded >= ASSIST_LIMITS.addEmptyBottle;

    function handleMenu() {
        soundEngine.resume();
        soundEngine.play('click');
        onMenu();
    }

    function handleReset() {
        soundEngine.resume();
        soundEngine.play('click');
        reset();
    }

    function handleUndo() {
        soundEngine.resume();
        soundEngine.play('click');
        openAssist('undo');
    }

    function handleAddBottle() {
        soundEngine.resume();
        soundEngine.play('click');
        openAssist('addEmptyBottle');
    }

    return (
        <div className="hud">
            <button className="jelly-btn" onClick={handleMenu}>☰ 菜单</button>
            <span>步数：{state.moves}</span>
            <span>时间：{seconds}秒</span>
            <button className="jelly-btn" disabled={undoDisabled} onClick={handleUndo}>
                撤销（{state.undosUsed}/{ASSIST_LIMITS.undo}）
            </button>
            <button className="jelly-btn" disabled={addDisabled} onClick={handleAddBottle}>
                +空瓶（{state.emptyBottlesAdded}/{ASSIST_LIMITS.addEmptyBottle}）
            </button>
            <button className="jelly-btn" onClick={handleReset}>重置</button>
        </div>
    );
}
