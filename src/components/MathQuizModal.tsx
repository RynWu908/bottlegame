// src/components/MathQuizModal.tsx
import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { generateQuestion } from '../game/mathquiz';
import { soundEngine } from '../game/sound';
import { useKeyboard } from '../hooks/useKeyboard';

/**
 * @brief 口算题弹窗：答对执行辅助（撤销/加空瓶），答错抖动并清空输入
 * @desc 仅在 isMathQuizOpen 时渲染；连续答错 2 次自动换题
 * @note useKeyboard 必须在 early return 之前调用以满足 Hooks 规则
 */
export function MathQuizModal() {
    const isOpen = useGameStore(s => s.isMathQuizOpen);
    const pending = useGameStore(s => s.pendingAssist);
    const onPassed = useGameStore(s => s.onQuizPassed);
    const close = useGameStore(s => s.closeAssist);
    const state = useGameStore(s => s.state);

    const [question, setQuestion] = useState(() => generateQuestion(state.difficulty));
    const [input, setInput] = useState('');
    const [wrongCount, setWrongCount] = useState(0);
    const [shake, setShake] = useState(false);
    const [glow, setGlow] = useState(false);

    function submit() {
        if (parseInt(input, 10) === question.answer) {
            soundEngine.play('correct');
            const assist = pending;
            setGlow(true);
            onPassed();
            reset();
            // 答对后延迟播放辅助音效，避免与 correct 音重叠
            if (assist === 'undo') {
                setTimeout(() => soundEngine.play('undo'), 200);
            } else if (assist === 'addEmptyBottle') {
                setTimeout(() => soundEngine.play('addBottle'), 200);
            }
        } else {
            soundEngine.play('wrong');
            const next = wrongCount + 1;
            setWrongCount(next);
            setShake(true);
            setTimeout(() => setShake(false), 200);
            setInput('');
            if (next >= 2) {
                setQuestion(generateQuestion(state.difficulty));
                setWrongCount(0);
            }
        }
    }

    function reset() {
        setQuestion(generateQuestion(state.difficulty));
        setInput('');
        setWrongCount(0);
        setGlow(false);
    }

    function handleClose() {
        soundEngine.play('click');
        close();
        reset();
    }

    function handleKeypad(digit: string) {
        soundEngine.playKeypad(parseInt(digit, 10));
        setInput(s => s + digit);
    }

    function handleBackspace() {
        soundEngine.play('click');
        setInput(s => s.slice(0, -1));
    }

    // 必须在 early return 之前调用，保证 hooks 调用数恒定
    useKeyboard(k => {
        if (k === 'back') setInput(s => s.slice(0, -1));
        else if (k === 'enter') submit();
        else setInput(s => s + k);
    }, isOpen);

    if (!isOpen) return null;

    const title = pending === 'undo' ? '撤销 · 答对即可回退一步' : '加空瓶 · 答对即可获得空瓶';

    const inputCls = ['quiz__input'];
    if (shake) inputCls.push('shake');
    if (glow) inputCls.push('glow');

    return (
        <div className="quiz-overlay" role="dialog" aria-label="口算题">
            <div className="quiz">
                <h3>{title}</h3>
                <div className="quiz__question">{question.display}</div>
                <input
                    className={inputCls.join(' ')}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    inputMode="numeric"
                    aria-label="答案"
                />
                <div className="quiz__keypad">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(n => (
                        <button key={n} onClick={() => handleKeypad(n)} aria-label={`数字 ${n}`}>{n}</button>
                    ))}
                    <button onClick={handleBackspace} aria-label="退格">⌫</button>
                    <button className="jelly-btn" data-test="submit" onClick={submit} aria-label="确定">确定</button>
                </div>
                <button className="jelly-btn quiz__close" onClick={handleClose} aria-label="关闭">关闭</button>
            </div>
        </div>
    );
}
