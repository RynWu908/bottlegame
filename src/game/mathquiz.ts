// src/game/mathquiz.ts
import type { Difficulty, MathQuestion } from './types';

/**
 * @brief 按难度档生成一道口算题
 * @param difficulty 关卡难度 1–5
 * @param seed 可选随机种子，用于复现
 * @return MathQuestion 含题目文本/答案/操作数/运算符
 * @throw RangeError 当 difficulty 不在 [1,5] 时
 */
export function generateQuestion(difficulty: Difficulty, seed?: number): MathQuestion {
    if (difficulty < 1 || difficulty > 5) {
        throw new RangeError(`difficulty must be in [1,5], got ${difficulty}`);
    }
    const rng = makeRng(seed ?? Math.floor(Math.random() * 1e9));
    switch (difficulty) {
        case 1: return genAddSub(rng, 10);
        case 2: return genAddSub(rng, 20);
        case 3: return genMixed99(rng);
        case 4: return genTwoDigitAndDiv(rng);
        case 5: return genParenMixed(rng);
    }
}

/** @brief 带种子的 PRNG（mulberry32） */
function makeRng(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s |= 0; s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function randInt(rng: () => number, min: number, max: number): number {
    return Math.floor(rng() * (max - min + 1)) + min;
}

/** @brief 加减法，result >= 0 且 <= max */
function genAddSub(rng: () => number, max: number): MathQuestion {
    const op = rng() < 0.5 ? '+' : '−';
    let a = randInt(rng, 0, max);
    // 加法收紧 b 上界保证 a+b <= max；减法 b 可取满 [0,max]
    let b = op === '+' ? randInt(rng, 0, max - a) : randInt(rng, 0, max);
    if (op === '−' && b > a) [a, b] = [b, a]; // 保证非负
    const answer = op === '+' ? a + b : a - b;
    return {
        question: `${a} ${op} ${b}`,
        answer,
        operands: [a, b],
        operators: [op],
        display: `${a} ${op} ${b} = ?`,
    };
}

function genMul(rng: () => number): MathQuestion {
    const a = randInt(rng, 2, 9);
    const b = randInt(rng, 2, 9);
    return {
        question: `${a} × ${b}`,
        answer: a * b,
        operands: [a, b],
        operators: ['×'],
        display: `${a} × ${b} = ?`,
    };
}

function genDiv(rng: () => number): MathQuestion {
    const b = randInt(rng, 2, 9);
    const k = randInt(rng, 1, 9);
    const a = b * k;
    return {
        question: `${a} ÷ ${b}`,
        answer: k,
        operands: [a, b],
        operators: ['÷'],
        display: `${a} ÷ ${b} = ?`,
    };
}

function genMixed99(rng: () => number): MathQuestion {
    const r = rng();
    if (r < 0.5) return genAddSub(rng, 99);
    if (r < 0.8) return genMul(rng);
    return genDiv(rng);
}

function genTwoDigitAndDiv(rng: () => number): MathQuestion {
    const r = rng();
    if (r < 0.4) return genAddSub(rng, 99);
    if (r < 0.7) return genMul(rng);
    return genDiv(rng);
}

function genParenMixed(rng: () => number): MathQuestion {
    const a = randInt(rng, 1, 9);
    const b = randInt(rng, 1, 9);
    const c = randInt(rng, 2, 4);
    const inner = a + b;
    const answer = inner * c;
    return {
        question: `(${a} + ${b}) × ${c}`,
        answer,
        operands: [a, b, c],
        operators: ['+', '×'],
        display: `(${a} + ${b}) × ${c} = ?`,
    };
}
