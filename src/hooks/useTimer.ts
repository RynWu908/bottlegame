// src/hooks/useTimer.ts
import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * @brief 游戏中每秒 tick 一次更新计时
 */
export function useTimer() {
    const status = useGameStore(s => s.state.status);
    const tick = useGameStore(s => s.tick);
    useEffect(() => {
        if (status !== 'playing') return;
        const id = setInterval(() => tick(1000), 1000);
        return () => clearInterval(id);
    }, [status, tick]);
}
