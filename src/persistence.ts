// src/persistence.ts
import type { SaveData } from './game/types';

export const SCHEMA_VERSION = 1;
const STORAGE_KEY = 'bottle-game:v1';

/** @brief 创建默认空存档 */
export function makeDefaultSave(): SaveData {
  return {
    version: SCHEMA_VERSION,
    progress: { unlockedLevelId: 1, lastPlayedId: 1 },
    records: {},
    victoryHistory: [],
    settings: { soundEnabled: true, reducedMotion: false },
  };
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateSave(JSON.parse(raw));
  } catch (e) {
    console.warn('loadSave failed:', e);
    return null;
  }
}

export function saveSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('saveSave failed (quota?):', e);
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('clearSave failed:', e);
  }
}

/** @brief 跨版本迁移老存档 */
export function migrateSave(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const version = obj['version'];
  if (typeof version !== 'number') return null;
  const base = makeDefaultSave();
  // v0 → v1: progress.unlockedLevelId 保留，其他字段补默认
  const progressRaw = obj['progress'] as { unlockedLevelId?: number } | undefined;
  return {
    ...base,
    ...obj,
    version: SCHEMA_VERSION,
    progress: {
      unlockedLevelId: progressRaw?.unlockedLevelId ?? 1,
      lastPlayedId: progressRaw?.unlockedLevelId ?? 1,
    },
    records: (obj['records'] as SaveData['records']) ?? {},
    victoryHistory: Array.isArray(obj['victoryHistory']) ? obj['victoryHistory'] as SaveData['victoryHistory'] : [],
    settings: (obj['settings'] as SaveData['settings']) ?? base.settings,
  } as SaveData;
}
