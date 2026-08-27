// src/game/solver.ts
import type { Bottle, SolveStep } from './types';
import { SOLVER_MAX_NODES } from './types';

/**
 * @brief 求解水分类关卡，返回最短解步骤序列
 * @desc BFS 搜索所有合法倒水分支，状态用规范化字符串哈希去重
 * @param bottles 初始局面
 * @param maxNodes 搜索节点上限，超出返回 null
 * @return SolveStep[] 最短解，无解返回 null
 * @note 复杂度 O(节点数 × 瓶子²)
 */
export function solve(
  bottles: readonly Bottle[],
  maxNodes: number = SOLVER_MAX_NODES
): SolveStep[] | null {
  if (isSolved(bottles)) return [];
  const start = normalize(bottles);
  const queue: Array<{ bottles: Bottle[]; path: SolveStep[] }> = [
    { bottles: clone(bottles), path: [] },
  ];
  const visited = new Set<string>([start]);

  while (queue.length > 0) {
    if (visited.size > maxNodes) return null;
    const cur = queue.shift()!;
    const n = cur.bottles.length;
    for (let from = 0; from < n; from++) {
      for (let to = 0; to < n; to++) {
        if (from === to) continue;
        const step = tryPour(cur.bottles, from, to);
        if (step === null) continue;
        const nextBottles = applyStep(cur.bottles, from, to, step);
        if (isSolved(nextBottles)) {
          return [...cur.path, { from, to, amount: step }];
        }
        const key = normalize(nextBottles);
        if (visited.has(key)) continue;
        visited.add(key);
        queue.push({
          bottles: nextBottles,
          path: [...cur.path, { from, to, amount: step }],
        });
      }
    }
  }
  return null;
}

function clone(bottles: readonly Bottle[]): Bottle[] {
  return bottles.map(b => ({ ...b, layers: [...b.layers] }));
}

/** @brief 规范化状态键：瓶子顺序无关 */
function normalize(bottles: readonly Bottle[]): string {
  return bottles
    .map(b => b.layers.join(','))
    .sort()
    .join('|');
}

function isSolved(bottles: readonly Bottle[]): boolean {
  return bottles.every(b => {
    if (b.layers.length === 0) return true;
    if (b.layers.length !== b.capacity) return false;
    const first = b.layers[0];
    return b.layers.every(c => c === first);
  });
}

/** @brief 尝试倒水，返回倒水量（一次倒到顶段合并极限），不可倒返回 null */
function tryPour(bottles: readonly Bottle[], from: number, to: number): number | null {
  const src = bottles[from];
  const dst = bottles[to];
  if (!src || !dst) return null;
  if (src.layers.length === 0) return null;
  if (dst.layers.length >= dst.capacity) return null;
  const srcTop = src.layers[src.layers.length - 1];
  if (srcTop === undefined) return null;
  if (dst.layers.length > 0) {
    const dstTop = dst.layers[dst.layers.length - 1];
    if (dstTop !== srcTop) return null;
  }
  // 同色瓶子互倒必败（剪枝）
  if (dst.layers.length === 0 && src.layers.every(c => c === srcTop)) {
    return null;
  }
  // 倒到极限
  let amount = 0;
  for (let i = src.layers.length - 1; i >= 0; i--) {
    if (src.layers[i] !== srcTop) break;
    if (dst.layers.length + amount >= dst.capacity) break;
    amount++;
  }
  return amount > 0 ? amount : null;
}

function applyStep(
  bottles: readonly Bottle[],
  from: number,
  to: number,
  amount: number
): Bottle[] {
  const next = clone(bottles);
  const src = next[from]!;
  const dst = next[to]!;
  for (let i = 0; i < amount; i++) {
    dst.layers.push(src.layers.pop()!);
  }
  return next;
}
