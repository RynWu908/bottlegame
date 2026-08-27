// src/store/useGameStore.ts
import { create } from 'zustand';
import type { Level, GameState, SaveData, Difficulty, VictoryEntry, LevelRecord } from '../game/types';
import { LEVELS } from '../game/levels';
import { RANDOM_PRESETS, generateLevel } from '../game/generator';
import { reducer, createInitialState } from '../game/reducer';
import { loadSave, saveSave, makeDefaultSave } from '../persistence';
import { computeStars } from '../game/stars';

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

  select: (index) => {
    set(s => ({ state: reducer(s.state, { type: 'select', index }) }));
    // 胜利瞬间自动落库战绩，避免用户跳过通关弹窗导致丢失
    if (get().state.status === 'won') get().save();
  },

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
    const won = s.state.status === 'won';
    const lv = s.currentLevel;
    const unlocked = won
      ? Math.max(s.saveData.progress.unlockedLevelId, (lv?.id ?? 0) + 1)
      : s.saveData.progress.unlockedLevelId;

    // 更新最佳记录
    let records = s.saveData.records;
    if (won && lv) {
      const id = lv.id;
      const existing = records[id];
      const stars = computeStars(s.state.moves, lv.par);
      const newRec: LevelRecord = {
        bestMoves: existing?.bestMoves == null ? s.state.moves : Math.min(existing.bestMoves, s.state.moves),
        bestTimeMs: existing?.bestTimeMs == null ? s.state.elapsedMs : Math.min(existing.bestTimeMs, s.state.elapsedMs),
        stars: Math.max(existing?.stars ?? 0, stars) as 0 | 1 | 2 | 3,
      };
      records = { ...records, [id]: newRec };
    }

    // 追加通关记录（去重：避免同一关同一结果重复记录）
    let victoryHistory = s.saveData.victoryHistory;
    if (won && lv) {
      const entry: VictoryEntry = {
        levelId: lv.id,
        moves: s.state.moves,
        timeMs: s.state.elapsedMs,
        stars: computeStars(s.state.moves, lv.par),
        date: new Date().toISOString(),
      };
      const last = victoryHistory[victoryHistory.length - 1];
      const isDup = last && last.levelId === entry.levelId && last.moves === entry.moves && last.timeMs === entry.timeMs;
      if (!isDup) {
        victoryHistory = [...victoryHistory, entry].slice(-100);
      }
    }

    const newSave: SaveData = {
      ...s.saveData,
      version: 1,
      progress: { ...s.saveData.progress, unlockedLevelId: unlocked },
      records,
      victoryHistory,
    };
    saveSave(newSave);
    set({ saveData: newSave });
  },

  loadProgress: () => {
    const loaded = loadSave();
    if (loaded) set({ saveData: loaded });
  },
}));
