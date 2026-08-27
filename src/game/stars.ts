// src/game/stars.ts

/** @brief 根据步数与 par 计算星级 */
export function computeStars(moves: number, par: number): 0 | 1 | 2 | 3 {
    if (moves <= par) return 3;
    if (moves <= par * 1.3) return 2;
    return 1;
}
