// scripts/verify-all.ts
import { LEVELS, COLOR_THEMES } from '../src/game/levels';
import { solve } from '../src/game/solver';
import { generateLevel, RANDOM_PRESETS } from '../src/game/generator';
import { generateQuestion } from '../src/game/mathquiz';
import type { Difficulty, MathQuestion } from '../src/game/types';

// tsconfig types 仅含 vitest/globals，脚本里用 process.exit 需局部声明类型
declare const process: { exit(code?: number): never };

let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (!cond) { console.error(`FAIL: ${msg}`); failed++; }
  else console.log(`PASS: ${msg}`);
}

console.log('=== 关卡校验 ===');
for (const level of LEVELS) {
  const sol = solve(level.bottles);
  assert(sol !== null, `关卡 ${level.id}: 可解`);
  assert(sol !== null && sol.length <= level.par * 1.5,
    `关卡 ${level.id}: 最短 ${sol?.length} 步 ≤ par*1.5 (${Math.floor(level.par*1.5)})`);
}

console.log('=== 色板校验 ===');
assert(COLOR_THEMES[1] !== undefined && COLOR_THEMES[1]!.c1 !== undefined, '难度 1 色板存在');
assert(COLOR_THEMES[3] !== undefined && COLOR_THEMES[3]!.c1 !== undefined, '难度 3 色板存在');
assert(COLOR_THEMES[5] !== undefined && COLOR_THEMES[5]!.c1 !== undefined, '难度 5 色板存在');

console.log('=== 随机关卡校验 ===');
([1,2,5] as Difficulty[]).forEach(d => {
  for (let i = 0; i < 100; i++) {
    const level = generateLevel(RANDOM_PRESETS[d], i);
    const sol = solve(level.bottles);
    if (sol === null) { console.error(`FAIL: 随机档 ${d} seed ${i} 不可解`); failed++; }
  }
  console.log(`PASS: 随机档 ${d} 100 关全部可解`);
});

console.log('=== 口算题校验 ===');
([1,2,3,4,5] as Difficulty[]).forEach(d => {
  for (let i = 0; i < 1000; i++) {
    const q = generateQuestion(d, i);
    if (!validateQuestion(q)) { console.error(`FAIL: 难度 ${d} seed ${i}: ${q.display}`); failed++; }
  }
  console.log(`PASS: 难度 ${d} 1000 题正确`);
});

function validateQuestion(q: MathQuestion): boolean {
  // 答案与题目一致
  let v = q.operands[0]!;
  for (let i = 0; i < q.operators.length; i++) {
    const op = q.operators[i]!;
    const next = q.operands[i + 1]!;
    if (op === '+') v += next;
    else if (op === '−') v -= next;
    else if (op === '×') v *= next;
    else if (op === '÷') {
      if (next === 0 || v % next !== 0) return false;
      v = Math.floor(v / next);
    }
  }
  if (v !== q.answer) return false;
  // 减法非负（单步题目）
  if (q.operators.length === 1 && q.operators[0] === '−') {
    if (q.operands[0]! < q.operands[1]!) return false;
  }
  // 乘法 ≤ 81
  if (q.operators.includes('×')) {
    const idx = q.operators.indexOf('×');
    const prod = q.operands[idx]! * q.operands[idx + 1]!;
    if (prod > 81) return false;
  }
  return true;
}

if (failed > 0) {
  console.error(`\n${failed} 项失败`);
  process.exit(1);
} else {
  console.log('\n全部校验通过');
}
