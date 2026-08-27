// src/game/reducer.ts
import type { GameState, Level, Bottle, Snapshot } from './types';
import { ASSIST_LIMITS } from './types';

export type GameAction =
  | { type: 'select'; index: number }
  | { type: 'reset' }
  | { type: 'tick'; deltaMs: number }
  | { type: 'addEmptyBottle' }
  | { type: 'undo' };

/** @brief 由关卡数据创建初始游戏状态 */
export function createInitialState(level: Level): GameState {
  return {
    bottles: level.bottles.map(b => ({ ...b, layers: [...b.layers] })),
    selected: null,
    moves: 0,
    history: [],
    emptyBottlesAdded: 0,
    undosUsed: 0,
    status: 'playing',
    elapsedMs: 0,
    levelId: level.id,
    par: level.par,
    difficulty: level.difficulty,
  };
}

/** @brief 顶层 reducer */
export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'select':
      return applySelect(state, action.index);
    case 'reset':
      // store 层负责从 levels 找原 level 重新 init；reducer 自己无法重建
      // 故 reset 在 reducer 内是 no-op，由 store 层调用 createInitialState 重新创建
      return state;
    case 'tick':
      return { ...state, elapsedMs: state.elapsedMs + action.deltaMs };
    case 'addEmptyBottle':
      return applyAddEmptyBottle(state);
    case 'undo':
      return applyUndo(state);
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

/** @brief 处理瓶子点击：选中/取消/倒水 */
function applySelect(state: GameState, index: number): GameState {
  if (state.selected === null) {
    // 当前无选中：若该瓶非空则选中
    const target = state.bottles[index];
    if (target === undefined) return state;
    if (target.layers.length === 0) return state;
    return { ...state, selected: index };
  }
  if (state.selected === index) {
    // 同瓶取消
    return { ...state, selected: null };
  }
  // 已选中 A，点 B：尝试倒水
  const from = state.selected;
  const to = index;
  if (!canPour(state.bottles, from, to)) {
    return state; // 非法：保留 selected，UI 播抖动
  }
  return pour(state, from, to);
}

/** @brief 判断从 from 到 to 是否可倒水 */
function canPour(bottles: Bottle[], from: number, to: number): boolean {
  const src = bottles[from];
  const dst = bottles[to];
  if (src === undefined || dst === undefined) return false;
  if (src.layers.length === 0) return false;
  if (dst.layers.length >= dst.capacity) return false;
  const srcTop = src.layers[src.layers.length - 1];
  if (srcTop === undefined) return false;
  if (dst.layers.length === 0) return true; // 空瓶可接任意色
  const dstTop = dst.layers[dst.layers.length - 1];
  return dstTop === srcTop;
}

/** @brief 执行倒水：A 顶段同色合并倒入 B 直到颜色变化或 B 满 */
function pour(state: GameState, from: number, to: number): GameState {
  const snapshot: Snapshot = {
    bottles: state.bottles.map(b => ({ ...b, layers: [...b.layers] })),
    moves: state.moves,
  };
  const newBottles = state.bottles.map(b => ({ ...b, layers: [...b.layers] }));
  const src = newBottles[from]!;
  const dst = newBottles[to]!;
  const srcTop = src.layers[src.layers.length - 1]!;
  // 倒到顶段同色合并到极限
  let amount = 0;
  while (
    src.layers.length > 0 &&
    src.layers[src.layers.length - 1] === srcTop &&
    dst.layers.length < dst.capacity
  ) {
    dst.layers.push(src.layers.pop()!);
    amount++;
  }
  const newState: GameState = {
    ...state,
    bottles: newBottles,
    selected: null,
    moves: state.moves + 1,
    history: [...state.history, snapshot],
  };
  return checkVictory(newState);
}

/** @brief 判定胜利：所有非空瓶子都是单一颜色且满 */
export function checkVictory(state: GameState): GameState {
  if (state.status === 'won') return state;
  const won = state.bottles.every(b => {
    if (b.layers.length === 0) return true;
    if (b.layers.length !== b.capacity) return false;
    const first = b.layers[0];
    if (first === undefined) return false;
    return b.layers.every(c => c === first);
  });
  return won ? { ...state, status: 'won', selected: null } : state;
}

// 临时实现，Task 3 完善
function applyAddEmptyBottle(state: GameState): GameState {
  if (state.emptyBottlesAdded >= ASSIST_LIMITS.addEmptyBottle) return state;
  const newId = state.bottles.length > 0
    ? Math.max(...state.bottles.map(b => b.id)) + 1
    : 0;
  const empty: Bottle = { id: newId, capacity: 4, layers: [] };
  return {
    ...state,
    bottles: [...state.bottles, empty],
    emptyBottlesAdded: state.emptyBottlesAdded + 1,
  };
}
function applyUndo(state: GameState): GameState {
  if (state.undosUsed >= ASSIST_LIMITS.undo) return state;
  if (state.history.length === 0) return state;
  const last = state.history[state.history.length - 1]!;
  return {
    ...state,
    bottles: last.bottles.map(b => ({ ...b, layers: [...b.layers] })),
    moves: last.moves,
    selected: null,
    history: state.history.slice(0, -1),
    undosUsed: state.undosUsed + 1,
    status: 'playing',
  };
}
