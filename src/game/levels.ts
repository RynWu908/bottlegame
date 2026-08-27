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
 * @desc 同一 id 用确定性种子序列，保证关卡数据稳定；capacityBoostIndices
 *       指定的瓶子 capacity 提升到 5（layers 不变），用于精通段
 *       "段长≠容量" 的处理难度
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

// === 入门 1–10 (difficulty=1)：单色合并直觉 ===
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
const LEVEL_3: Level = buildGeneratedLevel(3, 1, 2, 3, [5, 7]);
const LEVEL_4: Level = buildGeneratedLevel(4, 1, 2, 3, [6, 8]);
const LEVEL_5: Level = buildGeneratedLevel(5, 1, 3, 4, [6, 8]);
const LEVEL_6: Level = buildGeneratedLevel(6, 1, 3, 4, [7, 9]);
const LEVEL_7: Level = buildGeneratedLevel(7, 1, 3, 4, [7, 10]);
const LEVEL_8: Level = buildGeneratedLevel(8, 1, 3, 4, [8, 10]);
const LEVEL_9: Level = buildGeneratedLevel(9, 1, 3, 4, [8, 11]);
const LEVEL_10: Level = buildGeneratedLevel(10, 1, 3, 4, [9, 12]);

// === 进阶 11–25 (difficulty=2)：多色交错 ===
const LEVEL_11: Level = buildGeneratedLevel(11, 2, 3, 4, [10, 14]);
const LEVEL_12: Level = buildGeneratedLevel(12, 2, 3, 4, [10, 14]);
const LEVEL_13: Level = buildGeneratedLevel(13, 2, 4, 5, [12, 16]);
const LEVEL_14: Level = buildGeneratedLevel(14, 2, 4, 5, [12, 16]);
const LEVEL_15: Level = buildGeneratedLevel(15, 2, 4, 5, [13, 17]);
const LEVEL_16: Level = buildGeneratedLevel(16, 2, 4, 5, [13, 18]);
const LEVEL_17: Level = buildGeneratedLevel(17, 2, 4, 5, [14, 18]);
const LEVEL_18: Level = buildGeneratedLevel(18, 2, 4, 5, [14, 19]);
const LEVEL_19: Level = buildGeneratedLevel(19, 2, 4, 5, [15, 20]);
const LEVEL_20: Level = buildGeneratedLevel(20, 2, 4, 5, [15, 20]);
const LEVEL_21: Level = buildGeneratedLevel(21, 2, 4, 5, [16, 20]);
const LEVEL_22: Level = buildGeneratedLevel(22, 2, 4, 5, [16, 22]);
const LEVEL_23: Level = buildGeneratedLevel(23, 2, 4, 5, [16, 22]);
const LEVEL_24: Level = buildGeneratedLevel(24, 2, 4, 5, [18, 24]);
const LEVEL_25: Level = buildGeneratedLevel(25, 2, 4, 5, [18, 24]);

// === 挑战 26–40 (difficulty=3)：局部阻塞 ===
const LEVEL_26: Level = buildGeneratedLevel(26, 3, 4, 5, [14, 20]);
const LEVEL_27: Level = buildGeneratedLevel(27, 3, 4, 5, [15, 20]);
const LEVEL_28: Level = buildGeneratedLevel(28, 3, 5, 6, [16, 22]);
const LEVEL_29: Level = buildGeneratedLevel(29, 3, 5, 6, [16, 22]);
const LEVEL_30: Level = buildGeneratedLevel(30, 3, 5, 6, [17, 23]);
const LEVEL_31: Level = buildGeneratedLevel(31, 3, 5, 6, [17, 23]);
const LEVEL_32: Level = buildGeneratedLevel(32, 3, 5, 6, [18, 24]);
const LEVEL_33: Level = buildGeneratedLevel(33, 3, 5, 6, [18, 24]);
const LEVEL_34: Level = buildGeneratedLevel(34, 3, 5, 6, [19, 25]);
const LEVEL_35: Level = buildGeneratedLevel(35, 3, 5, 6, [19, 26]);
const LEVEL_36: Level = buildGeneratedLevel(36, 3, 5, 6, [20, 26]);
const LEVEL_37: Level = buildGeneratedLevel(37, 3, 5, 6, [20, 28]);
const LEVEL_38: Level = buildGeneratedLevel(38, 3, 5, 6, [22, 28]);
const LEVEL_39: Level = buildGeneratedLevel(39, 3, 5, 6, [22, 30]);
const LEVEL_40: Level = buildGeneratedLevel(40, 3, 5, 6, [24, 30]);

// === 精通 41–50 (difficulty=4)：容量 5 瓶出现 ===
// 注：6 色 7 瓶 BFS 易超 SOLVER_MAX_NODES 上限，精通段统一 5 色 6 瓶
//     + scatter [22,30]（与 RANDOM_PRESETS[4] 同规模，已验证可解），
//     靠 capacityBoost 维持精通段难度；8 关含 capacity=5 瓶满足 spec 要求
const LEVEL_41: Level = buildGeneratedLevel(41, 4, 5, 6, [22, 30], [0]);
const LEVEL_42: Level = buildGeneratedLevel(42, 4, 5, 6, [22, 30], [1]);
const LEVEL_43: Level = buildGeneratedLevel(43, 4, 5, 6, [22, 30]);
const LEVEL_44: Level = buildGeneratedLevel(44, 4, 5, 6, [22, 30], [2]);
const LEVEL_45: Level = buildGeneratedLevel(45, 4, 5, 6, [22, 30], [3]);
const LEVEL_46: Level = buildGeneratedLevel(46, 4, 5, 6, [22, 30]);
const LEVEL_47: Level = buildGeneratedLevel(47, 4, 5, 6, [22, 30], [4]);
const LEVEL_48: Level = buildGeneratedLevel(48, 4, 5, 6, [22, 30], [5]);
const LEVEL_49: Level = buildGeneratedLevel(49, 4, 5, 6, [22, 30], [0]);
const LEVEL_50: Level = buildGeneratedLevel(50, 4, 5, 6, [22, 30], [1]);

export const LEVELS: readonly Level[] = [
    LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6, LEVEL_7, LEVEL_8, LEVEL_9, LEVEL_10,
    LEVEL_11, LEVEL_12, LEVEL_13, LEVEL_14, LEVEL_15, LEVEL_16, LEVEL_17, LEVEL_18, LEVEL_19, LEVEL_20,
    LEVEL_21, LEVEL_22, LEVEL_23, LEVEL_24, LEVEL_25,
    LEVEL_26, LEVEL_27, LEVEL_28, LEVEL_29, LEVEL_30, LEVEL_31, LEVEL_32, LEVEL_33, LEVEL_34, LEVEL_35,
    LEVEL_36, LEVEL_37, LEVEL_38, LEVEL_39, LEVEL_40,
    LEVEL_41, LEVEL_42, LEVEL_43, LEVEL_44, LEVEL_45, LEVEL_46, LEVEL_47, LEVEL_48, LEVEL_49, LEVEL_50,
] as const;

/**
 * @brief 难度档主题色板
 * @desc 难度 1/2 复用暖色板；3/4 复用橙绿板；5 用深冷板（仅随机挑战档）
 */
export const COLOR_THEMES: Record<number, ColorTheme> = {
    1: { c1: '#FF6B6B', c2: '#4ECDC4', c3: '#FFE66D', c4: '#A8DADC', c5: '#9B5DE5', c6: '#F15BB5' },
    2: { c1: '#FF6B6B', c2: '#4ECDC4', c3: '#FFE66D', c4: '#A8DADC', c5: '#9B5DE5', c6: '#F15BB5' },
    3: { c1: '#F4A261', c2: '#E76F51', c3: '#FFD166', c4: '#06D6A0', c5: '#118AB2', c6: '#073B4C' },
    4: { c1: '#F4A261', c2: '#E76F51', c3: '#FFD166', c4: '#06D6A0', c5: '#118AB2', c6: '#073B4C' },
    5: { c1: '#5C2B81', c2: '#7B2CBF', c3: '#3A0CA3', c4: '#4361EE', c5: '#4CC9F0', c6: '#F72585' },
};
