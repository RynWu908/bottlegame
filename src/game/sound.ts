// src/game/sound.ts
/**
 * @brief Web Audio 音效合成模块（纯合成，零外部资源）
 * @desc 惰性创建 AudioContext，jsdom/SSR 环境自动降级为空操作
 * @note 首次播放必须在用户手势回调内调用以解锁音频上下文
 */

/** @brief 可播放的音效名称 */
type SoundName =
    | 'select'
    | 'pour'
    | 'correct'
    | 'wrong'
    | 'victory'
    | 'click'
    | 'undo'
    | 'addBottle';

/** @brief 数字键音名映射（C 大调音阶 0-9） */
const KEYPAD_FREQS: readonly number[] = [
    523.25, // C5  — 0
    261.63, // C4  — 1
    293.66, // D4  — 2
    329.63, // E4  — 3
    349.23, // F4  — 4
    392.00, // G4  — 5
    440.00, // A4  — 6
    493.88, // B4  — 7
    523.25, // C5  — 8
    587.33, // D5  — 9
] as const;

class SoundEngine {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private noiseBuffer: AudioBuffer | null = null;

    /** @brief 音效总开关，由存档 settings.soundEnabled 控制 */
    enabled = true;

    /**
     * @brief 惰性初始化 AudioContext 与主增益节点
     * @return AudioContext | null（环境不支持时返回 null）
     */
    private ensureContext(): AudioContext | null {
        if (this.ctx) return this.ctx;
        try {
            const Ctor = window.AudioContext;
            if (!Ctor) return null;
            this.ctx = new Ctor();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.25;
            this.master.connect(this.ctx.destination);
            this.noiseBuffer = this.createNoiseBuffer(this.ctx);
        } catch {
            this.ctx = null;
        }
        return this.ctx;
    }

    /**
     * @brief 生成 1 秒白噪声 buffer（倒水音用）
     * @param ctx AudioContext
     * @return AudioBuffer
     */
    private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
        const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buf;
    }

    /** @brief 恢复 suspended 状态的 AudioContext（移动端） */
    resume(): void {
        const ctx = this.ensureContext();
        if (ctx && ctx.state === 'suspended') void ctx.resume();
    }

    /**
     * @brief 播放指定音效
     * @param name SoundName | 音效名
     */
    play(name: SoundName): void {
        if (!this.enabled) return;
        const ctx = this.ensureContext();
        if (!ctx || !this.master) return;
        const master = this.master;
        switch (name) {
            case 'select':    this.playSelect(ctx, master);    break;
            case 'pour':       this.playPour(ctx, master);     break;
            case 'correct':    this.playCorrect(ctx, master);  break;
            case 'wrong':      this.playWrong(ctx, master);    break;
            case 'victory':    this.playVictory(ctx, master);  break;
            case 'click':      this.playClick(ctx, master);    break;
            case 'undo':       this.playUndo(ctx, master);     break;
            case 'addBottle':  this.playAddBottle(ctx, master);break;
        }
    }

    /**
     * @brief 播放数字键盘音（按数字对应音高）
     * @param digit 0-9
     */
    playKeypad(digit: number): void {
        if (!this.enabled) return;
        const freq = KEYPAD_FREQS[digit];
        if (freq === undefined) return;
        const ctx = this.ensureContext();
        if (!ctx || !this.master) return;
        this.playTone(ctx, this.master, freq, 0.08, 'sine', 0.2);
    }

    // ─── 私有合成方法 ───────────────────────────────────

    /**
     * @brief 合成单音
     * @param ctx AudioContext
     * @param master GainNode  | 输出目标
     * @param freq number      | 频率 Hz
     * @param dur number       | 时长秒
     * @param type OscillatorType | 波形
     * @param vol number      | 音量 0-1
     * @param delay number    | 延迟秒 [opt]
     */
    private playTone(
        ctx: AudioContext,
        master: GainNode,
        freq: number,
        dur: number,
        type: OscillatorType,
        vol: number,
        delay = 0,
    ): void {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime + delay;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(gain).connect(master);
        osc.start(t);
        osc.stop(t + dur + 0.05);
    }

    /** @brief 选中瓶子：气泡弹出（正弦 400→800Hz 上扬） */
    private playSelect(ctx: AudioContext, master: GainNode): void {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(gain).connect(master);
        osc.start(t);
        osc.stop(t + 0.16);
    }

    /** @brief 倒水：白噪声经低通滤波 + 渐变包络 */
    private playPour(ctx: AudioContext, master: GainNode): void {
        if (!this.noiseBuffer) return;
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.35);
        const gain = ctx.createGain();
        const t = ctx.currentTime;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
        gain.gain.setValueAtTime(0.15, t + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        src.connect(filter).connect(gain).connect(master);
        src.start(t);
        src.stop(t + 0.45);
    }

    /** @brief 答对：双音上行（E5→G5），愉悦感 */
    private playCorrect(ctx: AudioContext, master: GainNode): void {
        this.playTone(ctx, master, 659.25, 0.15, 'sine', 0.25);
        this.playTone(ctx, master, 783.99, 0.2, 'sine', 0.25, 0.1);
    }

    /** @brief 答错：下行锯齿（300→150Hz），失谐感 */
    private playWrong(ctx: AudioContext, master: GainNode): void {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.22);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain).connect(master);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    /** @brief 通关：C-E-G-C 上行琶音 fanfare */
    private playVictory(ctx: AudioContext, master: GainNode): void {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        const stepDur = 0.12;
        notes.forEach((f, i) => {
            this.playTone(ctx, master, f, stepDur * 2, 'triangle', 0.25, i * stepDur);
        });
        // 收尾长音
        this.playTone(ctx, master, 1046.5, 0.4, 'sine', 0.2, notes.length * stepDur);
    }

    /** @brief 按钮点击：短促方波 */
    private playClick(ctx: AudioContext, master: GainNode): void {
        this.playTone(ctx, master, 600, 0.05, 'square', 0.12);
    }

    /** @brief 撤销：正弦下行（800→300Hz），回退感 */
    private playUndo(ctx: AudioContext, master: GainNode): void {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.18);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain).connect(master);
        osc.start(t);
        osc.stop(t + 0.24);
    }

    /** @brief 加空瓶：弹出音 + 高频闪烁 */
    private playAddBottle(ctx: AudioContext, master: GainNode): void {
        this.playSelect(ctx, master);
        this.playTone(ctx, master, 1318.51, 0.12, 'sine', 0.15, 0.08);
    }
}

/** @brief 全局音效引擎单例 */
export const soundEngine = new SoundEngine();
