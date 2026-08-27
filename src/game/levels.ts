// src/game/levels.ts
import type { Level, ColorTheme, Difficulty, GenParams, Bottle } from './types';
import { generateLevel } from './generator';
import { solve } from './solver';

/** @brief 用 solve 离线计算最短解作为 par */
function buildFixedLevel(id: number, difficulty: Difficulty, bottles: Bottle[]): Level {
    const sol = solve(bottles);
    if (sol === null) throw new Error(`level ${id} unsolvable`);
    return { id, difficulty, par: sol.length, bottles };
}

/**
 * @brief 用 generateLevel 生成可解局并回填 id 与 par
 * @desc 同一 id 用确定性种子序列，保证关卡数据稳定
 */
function buildGeneratedLevel(
    id: number,
    difficulty: Difficulty,
    colorCount: number,
    bottleCount: number,
    scatterSteps: [number, number],
    capacityBoostIndices: readonly number[] = [],
): Level {
    const params: GenParams = {
        colorCount,
        bottleCount,
        capacity: 4,
        emptyCount: bottleCount - colorCount,
        scatterSteps,
        difficulty,
    };
    const seedBase = id * 7919 + 13;
    for (let offset = 0; offset < 150; offset++) {
        try {
            const gen = generateLevel(params, seedBase + offset);
            if (capacityBoostIndices.length === 0) {
                return { id, difficulty, par: gen.par, bottles: gen.bottles };
            }
            const bottles: Bottle[] = gen.bottles.map((b, i) =>
                capacityBoostIndices.includes(i) ? { ...b, capacity: 5 } : { ...b },
            );
            const sol = solve(bottles);
            if (sol === null) continue;
            return { id, difficulty, par: sol.length, bottles };
        } catch {
            // 切换到下一个种子继续尝试
        }
    }
    throw new Error(`buildGeneratedLevel: level ${id} failed after 150 seeds`);
}

// === 入门 1–6 (difficulty=1)：3→5 瓶，2→4 色 ===
const LEVEL_1: Level = buildFixedLevel(1, 1, [
    { id: 0, capacity: 4, layers: ['c1', 'c1', 'c2', 'c2'] },
    { id: 1, capacity: 4, layers: ['c2', 'c1', 'c1', 'c2'] },
    { id: 2, capacity: 4, layers: [] },
]);
const LEVEL_2: Level = buildFixedLevel(2, 1, [
    { id: 0, capacity: 4, layers: ['c1', 'c2', 'c3', 'c1'] },
    { id: 1, capacity: 4, layers: ['c2', 'c3', 'c1', 'c2'] },
    { id: 2, capacity: 4, layers: ['c3', 'c1', 'c2', 'c3'] },
    { id: 3, capacity: 4, layers: [] },
]);
const LEVEL_3: Level = buildGeneratedLevel(3, 1, 3, 4, [6, 10]);
const LEVEL_4: Level = buildGeneratedLevel(4, 1, 3, 5, [8, 12]);
const LEVEL_5: Level = buildGeneratedLevel(5, 1, 4, 5, [8, 12]);
const LEVEL_6: Level = buildGeneratedLevel(6, 1, 4, 5, [10, 14]);

// === 进阶 7–14 (difficulty=2)：5→7 瓶，4→5 色 ===
const LEVEL_7: Level = buildGeneratedLevel(7, 2, 4, 6, [10, 14]);
const LEVEL_8: Level = buildGeneratedLevel(8, 2, 4, 6, [12, 16]);
const LEVEL_9: Level = buildGeneratedLevel(9, 2, 5, 6, [12, 16]);
const LEVEL_10: Level = buildGeneratedLevel(10, 2, 5, 7, [14, 18]);
const LEVEL_11: Level = buildGeneratedLevel(11, 2, 5, 7, [16, 22]);
const LEVEL_12: Level = buildGeneratedLevel(12, 2, 5, 7, [18, 24]);
const LEVEL_13: Level = buildGeneratedLevel(13, 2, 5, 7, [20, 26]);
const LEVEL_14: Level = buildGeneratedLevel(14, 2, 5, 7, [22, 28]);

// === 挑战 15–28 (difficulty=3)：7→9 瓶，5→6 色 ===
const LEVEL_15: Level = buildGeneratedLevel(15, 3, 5, 7, [14, 18]);
const LEVEL_16: Level = buildGeneratedLevel(16, 3, 5, 7, [16, 22]);
const LEVEL_17: Level = buildGeneratedLevel(17, 3, 6, 7, [16, 22]);
const LEVEL_18: Level = buildGeneratedLevel(18, 3, 6, 8, [18, 24]);
const LEVEL_19: Level = buildGeneratedLevel(19, 3, 6, 8, [20, 26]);
const LEVEL_20: Level = buildGeneratedLevel(20, 3, 6, 8, [22, 28]);
const LEVEL_21: Level = buildGeneratedLevel(21, 3, 6, 8, [24, 30]);
const LEVEL_22: Level = buildGeneratedLevel(22, 3, 6, 9, [24, 30]);
const LEVEL_23: Level = buildGeneratedLevel(23, 3, 6, 9, [26, 32]);
const LEVEL_24: Level = buildGeneratedLevel(24, 3, 6, 9, [28, 34]);
const LEVEL_25: Level = buildGeneratedLevel(25, 3, 6, 9, [30, 36]);
const LEVEL_26: Level = buildGeneratedLevel(26, 3, 6, 9, [32, 38]);
const LEVEL_27: Level = buildGeneratedLevel(27, 3, 6, 9, [34, 40]);
const LEVEL_28: Level = buildGeneratedLevel(28, 3, 6, 9, [36, 42]);

// === 精通 29–50 (difficulty=4)：9 瓶 7 色，散布步数递增 ===
const LEVEL_29: Level = buildGeneratedLevel(29, 4, 7, 9, [22, 28]);
const LEVEL_30: Level = buildGeneratedLevel(30, 4, 7, 9, [24, 30]);
const LEVEL_31: Level = buildGeneratedLevel(31, 4, 7, 9, [26, 32]);
const LEVEL_32: Level = buildGeneratedLevel(32, 4, 7, 9, [28, 34]);
const LEVEL_33: Level = buildGeneratedLevel(33, 4, 7, 9, [30, 36]);
const LEVEL_34: Level = buildGeneratedLevel(34, 4, 7, 9, [32, 38]);
const LEVEL_35: Level = buildGeneratedLevel(35, 4, 7, 9, [34, 40]);
const LEVEL_36: Level = buildGeneratedLevel(36, 4, 7, 9, [36, 42]);
const LEVEL_37: Level = buildGeneratedLevel(37, 4, 7, 9, [38, 44]);
const LEVEL_38: Level = buildGeneratedLevel(38, 4, 7, 9, [40, 46]);
const LEVEL_39: Level = buildGeneratedLevel(39, 4, 7, 9, [42, 48]);
const LEVEL_40: Level = buildGeneratedLevel(40, 4, 7, 9, [44, 50]);
const LEVEL_41: Level = buildGeneratedLevel(41, 4, 7, 9, [46, 52]);
const LEVEL_42: Level = buildGeneratedLevel(42, 4, 7, 9, [48, 54]);
const LEVEL_43: Level = buildGeneratedLevel(43, 4, 7, 9, [50, 56]);
const LEVEL_44: Level = buildGeneratedLevel(44, 4, 7, 9, [52, 58]);
const LEVEL_45: Level = buildGeneratedLevel(45, 4, 7, 9, [54, 60]);
const LEVEL_46: Level = buildGeneratedLevel(46, 4, 7, 9, [56, 62]);
const LEVEL_47: Level = buildGeneratedLevel(47, 4, 7, 9, [58, 64]);
const LEVEL_48: Level = buildGeneratedLevel(48, 4, 7, 9, [60, 66]);
const LEVEL_49: Level = buildGeneratedLevel(49, 4, 7, 9, [62, 68]);
const LEVEL_50: Level = buildGeneratedLevel(50, 4, 7, 9, [64, 70]);

export const LEVELS: readonly Level[] = [
    LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6,
    LEVEL_7, LEVEL_8, LEVEL_9, LEVEL_10, LEVEL_11, LEVEL_12, LEVEL_13, LEVEL_14,
    LEVEL_15, LEVEL_16, LEVEL_17, LEVEL_18, LEVEL_19, LEVEL_20, LEVEL_21, LEVEL_22,
    LEVEL_23, LEVEL_24, LEVEL_25, LEVEL_26, LEVEL_27, LEVEL_28,
    LEVEL_29, LEVEL_30, LEVEL_31, LEVEL_32, LEVEL_33, LEVEL_34, LEVEL_35,
    LEVEL_36, LEVEL_37, LEVEL_38, LEVEL_39, LEVEL_40, LEVEL_41, LEVEL_42,
    LEVEL_43, LEVEL_44, LEVEL_45, LEVEL_46, LEVEL_47, LEVEL_48, LEVEL_49, LEVEL_50,
] as const;

/**
 * @brief 难度档主题色板（每档 8 色统一，确保高关卡 c7/c8 有色可取）
 * @desc 难度 1/2 复用暖色板；3/4 复用橙绿板；5 用深冷板（仅随机挑战档）
 */
export const COLOR_THEMES: Record<number, ColorTheme> = {
    1: { c1: '#FF6B6B', c2: '#4ECDC4', c3: '#FFE66D', c4: '#A8DADC', c5: '#9B5DE5', c6: '#F15BB5', c7: '#F4A261', c8: '#06D6A0' },
    2: { c1: '#FF6B6B', c2: '#4ECDC4', c3: '#FFE66D', c4: '#A8DADC', c5: '#9B5DE5', c6: '#F15BB5', c7: '#F4A261', c8: '#06D6A0' },
    3: { c1: '#F4A261', c2: '#E76F51', c3: '#FFD166', c4: '#06D6A0', c5: '#118AB2', c6: '#073B4C', c7: '#9B5DE5', c8: '#F15BB5' },
    4: { c1: '#F4A261', c2: '#E76F51', c3: '#FFD166', c4: '#06D6A0', c5: '#118AB2', c6: '#073B4C', c7: '#9B5DE5', c8: '#F15BB5' },
    5: { c1: '#5C2B81', c2: '#7B2CBF', c3: '#3A0CA3', c4: '#4361EE', c5: '#4CC9F0', c6: '#F72585', c7: '#FF6B6B', c8: '#4ECDC4' },
};
