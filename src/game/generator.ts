// src/game/generator.ts
import type { Bottle, Level, GenParams, Difficulty } from './types';
import { GENERATOR_MAX_ATTEMPTS } from './types';
import { solve } from './solver';

export const RANDOM_PRESETS: Record<Difficulty, GenParams> = {
  1: { colorCount: 3, bottleCount: 4, capacity: 4, emptyCount: 1, scatterSteps: [8, 12], difficulty: 1 },
  2: { colorCount: 4, bottleCount: 6, capacity: 4, emptyCount: 1, scatterSteps: [14, 20], difficulty: 2 },
  3: { colorCount: 4, bottleCount: 6, capacity: 4, emptyCount: 1, scatterSteps: [14, 20], difficulty: 3 },
  4: { colorCount: 5, bottleCount: 8, capacity: 4, emptyCount: 1, scatterSteps: [22, 30], difficulty: 4 },
  5: { colorCount: 5, bottleCount: 8, capacity: 4, emptyCount: 1, scatterSteps: [22, 30], difficulty: 5 },
};

/**
 * @brief 生成一个可解的随机水分类关卡
 * @note 生成-验证循环：终态逆向打散 → solve() 求 par → 不达标重抽
 * @throw Error 当尝试次数超过 GENERATOR_MAX_ATTEMPTS 时抛出
 */
export function generateLevel(params: GenParams, seed?: number): Level {
  const rng = makeRng(seed ?? Math.floor(Math.random() * 1e9));
  for (let attempt = 0; attempt < GENERATOR_MAX_ATTEMPTS; attempt++) {
    const bottles = scatterBackward(params, rng);
    const sol = solve(bottles);
    if (sol === null) continue;
    if (sol.length < params.colorCount * 1.5) continue;
    return {
      id: -1, // 随机关卡 ID 用 -1 标记，store 区分固定/随机
      bottles,
      par: sol.length,
      difficulty: params.difficulty,
    };
  }
  throw new Error(`generateLevel: failed after ${GENERATOR_MAX_ATTEMPTS} attempts`);
}

/** @brief 从已解终态出发逆向打散 */
function scatterBackward(params: GenParams, rng: () => number): Bottle[] {
  // 终态：colorCount 个瓶子各装 capacity 段同色 + emptyCount 个空瓶
  const bottles: Bottle[] = [];
  for (let c = 0; c < params.colorCount; c++) {
    const colorId = `c${c + 1}`;
    bottles.push({
      id: c,
      capacity: params.capacity,
      layers: Array(params.capacity).fill(colorId),
    });
  }
  for (let i = 0; i < params.emptyCount; i++) {
    bottles.push({ id: params.colorCount + i, capacity: params.capacity, layers: [] });
  }

  // 散布步数
  const [lo, hi] = params.scatterSteps;
  const steps = Math.floor(rng() * (hi - lo + 1)) + lo;

  // 逆操作：随机选 src，把其顶段任意量"反向推回"另一瓶 dst（无视颜色匹配约束）
  // 反向语义：从终态视角看是"把已解的某段水倒回去"，所以是 src 任意量 → dst，dst 不必空，颜色不必匹配
  for (let s = 0; s < steps; s++) {
    const from = randInt(rng, 0, bottles.length - 1);
    let to = randInt(rng, 0, bottles.length - 1);
    while (to === from) to = randInt(rng, 0, bottles.length - 1);
    const src = bottles[from]!;
    const dst = bottles[to]!;
    if (src.layers.length === 0) continue;
    if (dst.layers.length >= dst.capacity) continue;
    // 随机量：1 到 min(src.layers.length, dst.capacity - dst.layers.length)
    const maxAmount = Math.min(src.layers.length, dst.capacity - dst.layers.length);
    const amount = randInt(rng, 1, maxAmount);
    for (let i = 0; i < amount; i++) {
      dst.layers.push(src.layers.pop()!);
    }
  }
  return bottles;
}

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
