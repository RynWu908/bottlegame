// src/App.tsx
import { useState, useEffect } from 'react';
import { Menu } from './components/Menu';
import { LevelSelect } from './components/LevelSelect';
import { VictoryList } from './components/VictoryList';
import { Board } from './components/Board';
import { HUD } from './components/HUD';
import { VictoryOverlay } from './components/VictoryOverlay';
import { MathQuizModal } from './components/MathQuizModal';
import { useGameStore } from './store/useGameStore';
import { computeStars } from './game/stars';
import { soundEngine } from './game/sound';
import './styles/globals.css';

type Route = 'menu' | 'select' | 'game' | 'records';

/** @brief 应用根组件：菜单 ↔ 选关 ↔ 游戏 ↔ 通关 ↔ 战绩 路由 */
export default function App() {
    const [route, setRoute] = useState<Route>('menu');
    const state = useGameStore(s => s.state);
    const currentLevel = useGameStore(s => s.currentLevel);
    const loadProgress = useGameStore(s => s.loadProgress);
    const startLevel = useGameStore(s => s.startLevel);
    const startRandom = useGameStore(s => s.startRandom);
    const save = useGameStore(s => s.save);
    const saveData = useGameStore(s => s.saveData);
    const unlockedId = saveData.progress.unlockedLevelId;

    useEffect(() => { loadProgress(); }, [loadProgress]);

    // 同步音效开关到引擎
    useEffect(() => {
        soundEngine.enabled = saveData.settings.soundEnabled;
    }, [saveData.settings.soundEnabled]);

    const stars = computeStars(state.moves, currentLevel?.par ?? 1);

    if (route === 'menu') {
        return <Menu
            onPlay={() => setRoute('select')}
            onRecords={() => setRoute('records')}
            {...(unlockedId > 50 ? { onRandom: () => { startRandom(5); setRoute('game'); } } : {})}
        />;
    }
    if (route === 'select') {
        return <LevelSelect
            unlockedId={unlockedId}
            onSelect={(id) => { startLevel(id); setRoute('game'); }}
            onBack={() => setRoute('menu')}
        />;
    }
    if (route === 'records') {
        return <VictoryList onBack={() => setRoute('menu')} />;
    }
    return (
        <div className="game-route" style={{ minHeight: '100vh' }}>
            <HUD onMenu={() => { if (state.status === 'won') save(); setRoute('menu'); }} />
            <Board />
            <VictoryOverlay
                visible={state.status === 'won'}
                stars={state.status === 'won' ? stars : 0}
                onRetry={() => { save(); useGameStore.getState().reset(); }}
                onNext={() => {
                    save(); // 先记录本次胜利战绩
                    if (currentLevel && currentLevel.id > 0 && currentLevel.id < 50) {
                        startLevel(currentLevel.id + 1);
                    } else {
                        setRoute('menu');
                    }
                }}
            />
            <MathQuizModal />
        </div>
    );
}
