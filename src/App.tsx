// src/App.tsx
import { useState, useEffect } from 'react';
import { Menu } from './components/Menu';
import { LevelSelect } from './components/LevelSelect';
import { Board } from './components/Board';
import { HUD } from './components/HUD';
import { VictoryOverlay } from './components/VictoryOverlay';
import { MathQuizModal } from './components/MathQuizModal';
import { useGameStore } from './store/useGameStore';
import { computeStars } from './game/stars';
import './styles/globals.css';

type Route = 'menu' | 'select' | 'game';

/** @brief 应用根组件：菜单 ↔ 选关 ↔ 游戏 ↔ 通关 路由 */
export default function App() {
    const [route, setRoute] = useState<Route>('menu');
    const state = useGameStore(s => s.state);
    const currentLevel = useGameStore(s => s.currentLevel);
    const loadProgress = useGameStore(s => s.loadProgress);
    const startLevel = useGameStore(s => s.startLevel);
    const startRandom = useGameStore(s => s.startRandom);
    const save = useGameStore(s => s.save);
    const unlockedId = useGameStore(s => s.saveData.progress.unlockedLevelId);

    useEffect(() => { loadProgress(); }, [loadProgress]);

    const stars = computeStars(state.moves, currentLevel?.par ?? 1);

    if (route === 'menu') {
        return <Menu
            onPlay={() => setRoute('select')}
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
    return (
        <>
            <HUD onMenu={() => setRoute('menu')} />
            <Board />
            <VictoryOverlay
                visible={state.status === 'won'}
                stars={state.status === 'won' ? stars : 0}
                onRetry={() => useGameStore.getState().reset()}
                onNext={() => {
                    if (currentLevel && currentLevel.id > 0 && currentLevel.id < 50) {
                        startLevel(currentLevel.id + 1);
                    } else {
                        save();
                        setRoute('menu');
                    }
                }}
            />
            <MathQuizModal />
        </>
    );
}
