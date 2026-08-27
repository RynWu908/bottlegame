/**
 * @brief 倒水瓶游戏全部类型定义
 * @desc 纯类型文件，零运行时依赖，被 game/ 与 UI 层共同消费
 */

export type ColorId = string;
export type ColorTheme = Record<ColorId, string>;

export interface Bottle {
    id: number;
    capacity: number;
    layers: ColorId[];
}

export interface Level {
    id: number;
    bottles: Bottle[];
    par: number;
    difficulty: 1 | 2 | 3 | 4 | 5;
}

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface GameState {
    bottles: Bottle[];
    selected: number | null;
    moves: number;
    history: Snapshot[];
    emptyBottlesAdded: number;
    undosUsed: number;
    status: 'playing' | 'won';
    elapsedMs: number;
    levelId: number;
    par: number;
    difficulty: Difficulty;
}

export interface Snapshot {
    bottles: Bottle[];
    moves: number;
}

export interface SolveStep {
    from: number;
    to: number;
    amount: number;
}

export interface MathQuestion {
    question: string;
    answer: number;
    operands: number[];
    operators: string[];
    display: string;
}

export interface GenParams {
    colorCount: number;
    bottleCount: number;
    capacity: number;
    emptyCount: number;
    scatterSteps: [number, number];
    difficulty: Difficulty;
}

export interface LevelRecord {
    bestMoves: number | null;
    bestTimeMs: number | null;
    stars: 0 | 1 | 2 | 3;
}

export interface SaveData {
    version: number;
    progress: {
        unlockedLevelId: number;
        lastPlayedId: number;
    };
    records: Record<number, LevelRecord>;
    settings: {
        soundEnabled: boolean;
        reducedMotion: boolean;
    };
}

/** 撤销/加空瓶的每关额度上限 */
export const ASSIST_LIMITS = {
    undo: 3,
    addEmptyBottle: 1,
} as const;

/** 求解器节点上限 */
export const SOLVER_MAX_NODES = 200_000;

/** 随机生成器最大尝试次数 */
export const GENERATOR_MAX_ATTEMPTS = 100;
