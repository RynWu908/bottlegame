// src/hooks/useKeyboard.ts
import { useEffect } from 'react';

/**
 * @brief 监听 PC 键盘 0-9/Backspace/Enter，转给回调
 * @param onKey 按键回调，0-9 映射数字字符，Backspace→'back'，Enter→'enter'
 * @param enabled 是否启用监听
 * @note enabled=false 时不挂载监听；onKey 每次渲染变更会重建监听
 */
export function useKeyboard(
    onKey: (k: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'back' | 'enter') => void,
    enabled: boolean
) {
    useEffect(() => {
        if (!enabled) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') onKey(e.key as '0');
            else if (e.key === 'Backspace') onKey('back');
            else if (e.key === 'Enter') onKey('enter');
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onKey, enabled]);
}
