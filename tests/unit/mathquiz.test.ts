// tests/unit/mathquiz.test.ts
import { describe, it, expect } from 'vitest';
import { generateQuestion } from '../../src/game/mathquiz';

describe('mathquiz — difficulty 1 (10 以内加减)', () => {
  for (let i = 0; i < 200; i++) {
    it(`第 ${i} 题：答案正确、数值在 0–10、减法非负`, () => {
      const q = generateQuestion(1, i);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThanOrEqual(10);
      for (const op of q.operands) {
        expect(op).toBeGreaterThanOrEqual(0);
        expect(op).toBeLessThanOrEqual(10);
      }
      // 验证答案与题目一致
      expect(recompute(q)).toBe(q.answer);
    });
  }
});

function recompute(q: { operands: number[]; operators: string[] }): number {
  let v = q.operands[0]!;
  for (let i = 0; i < q.operators.length; i++) {
    const op = q.operators[i]!;
    const next = q.operands[i + 1]!;
    if (op === '+') v += next;
    else if (op === '−') v -= next;
    else if (op === '×') v *= next;
    else if (op === '÷') v = Math.floor(v / next);
  }
  return v;
}

describe('mathquiz — difficulty 4 (整除)', () => {
  for (let i = 0; i < 100; i++) {
    it(`第 ${i} 题：除法必整除`, () => {
      const q = generateQuestion(4, i);
      if (q.operators.includes('÷')) {
        const idx = q.operators.indexOf('÷');
        const a = q.operands[idx]!;
        const b = q.operands[idx + 1]!;
        expect(a % b).toBe(0);
      }
    });
  }
});

describe('mathquiz — seed 复现', () => {
  it('同 seed 同题', () => {
    const a = generateQuestion(3, 42);
    const b = generateQuestion(3, 42);
    expect(a).toEqual(b);
  });
});

describe('mathquiz — 边界', () => {
  it('difficulty=0 抛 RangeError', () => {
    expect(() => generateQuestion(0 as never)).toThrow(RangeError);
  });
  it('difficulty=6 抛 RangeError', () => {
    expect(() => generateQuestion(6 as never)).toThrow(RangeError);
  });
});
