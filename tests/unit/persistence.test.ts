// tests/unit/persistence.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSave, saveSave, clearSave, migrateSave, SCHEMA_VERSION, makeDefaultSave } from '../../src/persistence';

beforeEach(() => localStorage.clear());

describe('persistence', () => {
  it('saveSave → loadSave 往返', () => {
    const data = makeDefaultSave();
    data.progress.unlockedLevelId = 5;
    saveSave(data);
    const loaded = loadSave();
    expect(loaded).not.toBeNull();
    expect(loaded!.progress.unlockedLevelId).toBe(5);
    expect(loaded!.version).toBe(SCHEMA_VERSION);
  });

  it('未存档时 loadSave 返回 null', () => {
    expect(loadSave()).toBeNull();
  });

  it('clearSave 后无存档', () => {
    saveSave(makeDefaultSave());
    clearSave();
    expect(loadSave()).toBeNull();
  });

  it('老版本存档走 migrateSave', () => {
    const oldData = { version: 0, progress: { unlockedLevelId: 3 } };
    localStorage.setItem('bottle-game:v1', JSON.stringify(oldData));
    const migrated = migrateSave(JSON.parse(localStorage.getItem('bottle-game:v1')!));
    expect(migrated).not.toBeNull();
    expect(migrated!.version).toBe(SCHEMA_VERSION);
    expect(migrated!.progress.unlockedLevelId).toBe(3);
  });

  it('损坏数据返回 null', () => {
    localStorage.setItem('bottle-game:v1', 'not-json');
    expect(loadSave()).toBeNull();
  });
});
