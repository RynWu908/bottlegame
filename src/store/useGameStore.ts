// src/store/useGameStore.ts
import { create } from 'zustand';
import type { Level, GameState, SaveData, Difficulty } from '../game/types';
import { LEVELS } from '../game/levels';
import { RANDOM_PRESETS, generateLevel } from '../game/generator';
import { reducer, createInitialState } from '../game/reducer';
import { loadSave, saveSave, makeDefaultSave } from '../persistence';

type AssistKind = 'undo' | 'addEmptyBottle';

/**
 * @brief 倒水瓶游戏全局 store：包装 reducer 并接管辅助能力（口算题门禁）
 * @desc 字段 saveData（SaveData）与函数 save() 并存——函数名保留，字段改名以避免冲突
 */
interface StoreState {
  state: GameState;
  currentLevel: Level | null;
  isMathQuizOpen: boolean;
  pendingAssist: AssistKind | null;
  saveData: SaveData;
  startLevel: (id: number) => void;
  startRandom: (d: Difficulty) => void;
  select: (index: number) => void;
  undo: () => void;        // 直接撤销（不经口算题，仅给测试用）
  addEmptyBottle: () => void;
  reset: () => void;
  tick: (deltaMs: number) => void;
  openAssist: (kind: AssistKind) => void;
  closeAssist: () => void;
  onQuizPassed: () => void;
  save: () => void;
  loadProgress: () => void;
}

export const useGameStore = create<StoreState>((set, get) => ({
  state: createInitialState(LEVELS[0]!),
  currentLevel: LEVELS[0] ?? null,
  isMathQuizOpen: false,
  pendingAssist: null,
  saveData: makeDefaultSave(),

  startLevel: (id) => {
    const lv = LEVELS.find(l => l.id === id) ?? null;
    if (!lv) return;
    set(s => ({
      currentLevel: lv,
      state: createInitialState(lv),
      isMathQuizOpen: false,
      pendingAssist: null,
      saveData: { ...s.saveData, progress: { ...s.saveData.progress, lastPlayedId: id } },
    }));
    get().save();
  },

  startRandom: (d) => {
    const lv = generateLevel(RANDOM_PRESETS[d]!);
    set({ currentLevel: lv, state: createInitialState(lv), isMathQuizOpen: false, pendingAssist: null });
  },

  select: (index) => set(s => ({ state: reducer(s.state, { type: 'select', index }) })),

  undo: () => set(s => ({ state: reducer(s.state, { type: 'undo' }) })),
  addEmptyBottle: () => set(s => ({ state: reducer(s.state, { type: 'addEmptyBottle' }) })),

  reset: () => {
    const lv = get().currentLevel;
    if (!lv) return;
    set({ state: createInitialState(lv), isMathQuizOpen: false, pendingAssist: null });
  },

  tick: (deltaMs) => set(s => ({ state: reducer(s.state, { type: 'tick', deltaMs }) })),

  openAssist: (kind) => {
    // 检查额度：达上限直接拒绝，不打开口算题弹窗
    const s = get().state;
    if (kind === 'undo' && s.undosUsed >= 3) return;
    if (kind === 'addEmptyBottle' && s.emptyBottlesAdded >= 1) return;
    set({ isMathQuizOpen: true, pendingAssist: kind });
  },

  closeAssist: () => set({ isMathQuizOpen: false, pendingAssist: null }),

  onQuizPassed: () => {
    const kind = get().pendingAssist;
    if (!kind) return;
    if (kind === 'undo') get().undo();
    else if (kind === 'addEmptyBottle') get().addEmptyBottle();
    set({ isMathQuizOpen: false, pendingAssist: null });
  },

  save: () => {
    const s = get();
    const unlocked = s.state.status === 'won'
      ? Math.max(s.saveData.progress.unlockedLevelId, (s.currentLevel?.id ?? 0) + 1)
      : s.saveData.progress.unlockedLevelId;
    const newSave: SaveData = {
      ...s.saveData,
      version: 1,
      progress: { ...s.saveData.progress, unlockedLevelId: unlocked },
    };
    saveSave(newSave);
    set({ saveData: newSave });
  },

  loadProgress: () => {
    const loaded = loadSave();
    if (loaded) set({ saveData: loaded });
  },
}));
