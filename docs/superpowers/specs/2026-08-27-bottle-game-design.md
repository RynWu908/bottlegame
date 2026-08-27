# 倒水瓶游戏设计文档（Bottle Game）

- 日期：2026-08-27
- 状态：Draft（待用户审查）
- 范围：完整产品设计与架构，覆盖功能、数据模型、交互、视觉、关卡、求解器、持久化、测试、脚手架

## 1. 概述

### 1.1 目标

复刻微信小程序"倒水瓶"（经典 Water Sort Puzzle 水分类玩法）的核心体验，做一个**完全无广告、可跨手机/平板/PC 浏览器运行**的纯净版本。增加"答口算题解锁辅助功能"机制，让小朋友在解谜的同时练口算。

### 1.2 范围

- 玩法：经典水分类（点瓶 A → 点瓶 B，A 顶段同色水倒入 B，最终每瓶单色）
- 平台：Web 优先，单套代码响应式适配手机/平板/PC
- 模式：纯单机，无后端、无账号、无联网功能
- 关卡：50 关固定 + 三档随机挑战
- 视觉：玻璃拟态（glassmorphism）
- 辅助：撤销 + 加空瓶，每次使用需答对口算题
- 部署：静态站，Vercel/Netlify/GitHub Pages 任选

### 1.3 硬约束

- **禁止广告/推广/分享得解锁**：相关代码路径不存在；辅助功能仅靠"答口算题 + 每关上限"约束
- **跨端**：单套 HTML/CSS/JS，无原生包，移动浏览器与桌面浏览器一致体验
- **零运维**：纯静态资源部署，无服务端

### 1.4 不在范围内

- 用户账号体系、云端进度同步、社交分享
- 内购、付费关卡、订阅
- 多人模式
- 复杂物理引擎、3D 渲染

## 2. 技术选型

| 维度 | 选择 | 理由 |
|---|---|---|
| 框架 | React 18 + TypeScript | 生态成熟，响应式布局方便 |
| 构建 | Vite | HMR 快，产物小 |
| 状态 | Zustand | 轻量，比 Redux 简洁，避免 Context 重渲染 |
| 样式 | 原生 CSS + CSS Variables | 不引 UI 库，包体积小 |
| 持久化 | localStorage | 纯单机无需后端 |
| 测试 | Vitest + Playwright（可选） | 单元/集成/E2E |
| 部署 | 静态站 | 零运维 |

包体积目标：gzip 后 < 200KB。

## 3. 架构分层

三层架构，单向数据流：

```
┌──────────────────────────────────────────────┐
│  UI 层（React 组件）                          │
│  Bottle / Board / HUD / LevelSelect / Menu   │
│  MathQuizModal / VictoryOverlay              │
│  只读 store，派发 action                       │
└──────────────┬───────────────────────────────┘
               │ subscribe / dispatch
┌──────────────▼───────────────────────────────┐
│  状态层（Zustand store）                      │
│  当前关/进度/解锁集/最佳成绩/撤销栈/剩余辅助    │
└──────────────┬───────────────────────────────┘
               │ 调用纯函数
┌──────────────▼───────────────────────────────┐
│  纯逻辑层（src/game/，零 React 依赖）         │
│  types · reducer · solver · generator         │
│  mathquiz · levels                            │
└──────────────────────────────────────────────┘
```

**边界铁律**：`src/game/` 不 import 任何 React/Zustand，所有状态变换是 `(state, action) => state` 的纯函数；store 是这些纯函数的薄包装。求解器、生成器、口算题生成器全部可独立单测。

## 4. 数据模型

### 4.1 核心类型

```typescript
// 颜色用稳定 ID（而非色值），方便主题切换与色盲模式
type ColorId = string;                    // 如 "c1","c2"
type ColorTheme = Record<ColorId, string>; // ID -> CSS 颜色

// 瓶子：从底到顶依次记录每段颜色（同色合并，无空洞）
// 空瓶 = []; 满瓶且同色 = solved 状态之一
interface Bottle {
  id: number;
  capacity: number;          // 容量，默认 4
  layers: ColorId[];          // layers[0] 是瓶底
}

// 关卡：初始瓶子布局 + 参考步数 + 难度
interface Level {
  id: number;
  bottles: Bottle[];          // 含初始空瓶
  par: number;                // 参考最少步数（solver 算出后调高 10–20%）
  difficulty: 1 | 2 | 3 | 4 | 5;
}

// 游戏运行时状态（reducer 的工作对象）
interface GameState {
  bottles: Bottle[];          // 当前局面
  selected: number | null;     // 当前选中瓶子下标
  moves: number;              // 已用步数
  history: Snapshot[];        // 撤销栈
  emptyBottlesAdded: number;  // 本关已加空瓶数
  undosUsed: number;          // 本关已用撤销数
  status: 'playing' | 'won';
  elapsedMs: number;          // 计时（UI tick 更新，不在 reducer 算）
}

interface Snapshot {
  bottles: Bottle[];          // 深拷贝
  moves: number;
}

interface SolveStep {
  from: number;
  to: number;
  amount: number;
}

type Difficulty = 1 | 2 | 3 | 4 | 5;

interface MathQuestion {
  question: string;           // "7 + 6"
  answer: number;             // 13
  operands: number[];         // [7, 6] 或 [8,3,2]（混合运算）
  operators: string[];        // ['+'] 或 ['+','×']
  display: string;            // "7 + 6 = ?" 完整展示串
}

interface GenParams {
  colorCount: number;
  bottleCount: number;
  capacity: number;
  emptyCount: number;
  scatterSteps: [number, number];  // 散布步数区间
  difficulty: Difficulty;
}
```

### 4.2 设计要点

- **layers 同色合并存储**：倒水时只需弹出/推入一段，逻辑简洁；渲染时按段高绘制
- **撤销用快照栈**：实现简单，内存可控（每关最多几十步，深拷贝成本可忽略）
- **颜色 ID 与主题分离**：色盲模式/换肤只改主题，逻辑零改动

### 4.3 倒水规则（reducer 核心不变量）

点瓶子 A → 点瓶子 B：

1. A 非空，B 有空位
2. **A 顶段颜色 == B 顶段颜色**，或 B 为空瓶
3. 倒水量 = `min(A顶段长度, B剩余容量)`
4. 从 A 弹出该量，压入 B 顶段（同色合并）
5. 倒水前：将当前 bottles + moves 深拷贝压入 history，再执行倒水，moves +1

胜利条件：所有非空瓶子的 layers 都是单一颜色且满（或全空）。`status='won'`。reducer 在倒水完成后立即判定 status，UI 层在倒水动画（约 400ms）结束后才读取 status='won' 并触发庆祝层。

## 5. 交互流程与玻璃拟态动画

### 5.1 交互状态机

```
[空闲] ──点瓶子A──> [选中A] ──点瓶子B──┐
   ▲                                 │
   │                                 ├─B==A → 取消选中 → [空闲]
   │                                 ├─合法倒水 → 倒水动画 → [空闲]
   │                                 └─非法（颜色不符/满瓶）→ 摇晃提示 → [选中A]保留
   └─────────────────────────────────┘
```

**非法操作反馈**：瓶子左右抖动 200ms（CSS `@keyframes shake`），不弹任何 toast/modal——水分类玩家要的是"试错-调整"的流畅感，弹窗会打断节奏。**非法操作后保留选中态**（不自动回空闲），让玩家继续选目标瓶而不必重新点源瓶。

**选中态视觉**：选中瓶整体上浮 6px + 瓶口辉光（box-shadow），让小朋友一眼看出"这个被拿起来了"。

**触控友好**：瓶子点击区 = 整个 div（含边距），最小热区 44×44px（iOS HIG 最低值）。

### 5.2 响应式布局

单套布局，CSS `vmin` + 媒体查询适配三端：

- 瓶子尺寸：`min(8vmin, 96px)` 宽，2.2 倍高
- 棋盘网格：`grid-template-columns: repeat(auto-fit, minmax(瓶子宽, 1fr))`
- 棋盘容器最大宽：PC 720px 居中，平板/手机 100%
- 字体：`clamp(14px, 2.2vmin, 18px)`
- 断点仅 2 个：
  - `<=640px`（手机）：瓶子最大 64px，HUD 按钮竖排
  - `>640px`（平板/PC）：瓶子最大 96px，HUD 横排

### 5.3 玻璃拟态视觉

每个瓶子是 **div 外壳 + 内嵌 SVG 液体**：

```css
.bottle {
  --glass-bg: rgba(255,255,255,.08);
  --glass-border: rgba(255,255,255,.25);
  position: relative;
  width: var(--w); height: var(--h);
  border-radius: 28px 28px 24px 24px / 50% 50% 24px 24px;
  background: var(--glass-bg);
  border: 1.5px solid var(--glass-border);
  backdrop-filter: blur(6px);
  box-shadow: inset 0 2px 8px rgba(255,255,255,.3),
              inset 0 -4px 12px rgba(0,0,0,.15),
              0 4px 16px rgba(0,0,0,.12);
  overflow: hidden;
}
.bottle::before {                        /* 左上高光 */
  content: ''; position: absolute; top: 8%; left: 12%;
  width: 18%; height: 60%;
  background: linear-gradient(to right, rgba(255,255,255,.45), transparent);
  border-radius: 50%; filter: blur(2px);
}
.bottle__liquid {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 100%;
  transition: height .35s cubic-bezier(.4,0,.2,1);
  pointer-events: none;
}
```

**液体 SVG 结构**（每个色段一个 `<path>`）：

```svg
<svg viewBox="0 0 100 100" preserveAspectRatio="none">
  <path d="M0,H L0,100 L100,100 L100,H Q50,H+wave 0,H Z" fill="var(--color)"/>
</svg>
```

- `H` = 该段顶部 y 坐标，由 `fillPercent` 反算
- 倒水时：源瓶顶段 `fillPercent` ↓，目标瓶顶段 `fillPercent` ↑，CSS transition 自动生成"液面升降"
- 多色段：从底往上叠加多个 path，每段独立 transition

### 5.4 倒水动画时序

```
t=0      用户点 B（目标瓶）合法
         reducer 立即更新 bottles + moves + history（数据先行）
         UI 加 .pouring class 锁住下次输入 ~400ms

t=0~350  CSS transition：源瓶顶段高度 ↓、目标瓶顶段高度 ↑
         同时源瓶口出现"水滴"SVG，沿弧线 path 飞向目标瓶口
         （CSS offset-path，0.35s 飞完）

t=350~400 瓶口辉光淡出，.pouring 移除，恢复可点

t=400+   胜利检测：status='won' 触发庆祝层（撒花 SVG + "下一关"按钮）
```

**输入节流**：`.pouring` 期间忽略点击，避免动画叠加导致状态错乱。400ms 是有意的"视觉确认窗口"，给小朋友留反应时间。

## 6. 辅助功能：口算题解锁

### 6.1 机制

撤销/加空瓶不消耗固定次数，而是每次点击弹一道口算题，答对才执行操作。

| 操作 | 触发 | 答对效果 | 每关上限 |
|---|---|---|---|
| 撤销 Undo | HUD"撤销"按钮 | 弹题 → 答对 → 回退一步 | 每关 3 次 |
| 加空瓶 | HUD"+空瓶"按钮 | 弹题 → 答对 → 棋盘右侧滑入空瓶 | 每关 1 次 |

**额度消耗时机**：仅在答对时才消耗一次额度，答错（包括连续答错换题）不消耗。已用额度满后按钮置灰。

**为什么保留每关上限**：
- 撤销无限 → 关卡难度被掏空，3 次是"救场"而非"通关工具"
- 加空瓶无限 → 任何关都变 1 星难度，1 个空瓶已足够解局
- 上限到了按钮置灰、文案变"本关已用完"，**仍零广告**

### 6.2 答错处理（温和不挫败）

- 题目不变，输入框抖动 200ms + 提示"再想想"
- 连续答错 2 次：自动换一题（避免卡死），不扣任何东西
- 不限答题次数（答错本身已是成本，无需额外惩罚）

### 6.3 口算题交互 UI

轻量 modal，不离开游戏场景：

```
┌────────────────────────────────┐
│  撤销 · 答对即可回退一步         │ ← 标题说明用途
│                                │
│         7 + 6 = [   ]          │ ← 题目 + 答案框
│                                │
│   [1][2][3]                    │
│   [4][5][6]  ← 数字键盘        │ ← 移动端友好，PC 可键盘输入
│   [7][8][9]                    │
│   [0][⌫]   [确定]              │
│                                │
│         [关闭]                  │ ← 不强制答，可放弃
└────────────────────────────────┘
   半透明遮罩盖住棋盘，瓶子轮廓仍可见
```

**视觉**：玻璃拟态卡片（`backdrop-filter: blur(12px)` 与瓶子同语言），题目用大字号 `clamp(28px, 5vmin, 40px)`，数字键盘热区 56×56px。

**答对动画**：卡片绿色辉光 0.3s + "答对啦！"toast 0.8s + 执行对应操作，自动关闭。

**答错动画**：输入框红色描边 + 左右抖动 200ms，答案清空，保留题目（或第 2 次答错换题）。

**无障碍**：
- 数字键盘按钮带 `aria-label`
- 支持 PC 物理键盘 0–9、退格、回车
- `prefers-reduced-motion` 时关闭抖动/辉光

### 6.4 题目难度档位

| 关卡难度 | 题型 | 数值范围 | 示例 |
|---|---|---|---|
| 1 | 10 以内加减 | a,b ∈ [0,10]，减法结果 ≥0 | `3 + 4`、`8 − 2` |
| 2 | 20 以内加减 | a,b ∈ [0,20]，减法结果 ≥0 | `15 − 7`、`9 + 6` |
| 3 | 99 以内加减 + 乘法表局部 | 加减 a,b ∈ [0,99]；乘法 a,b ∈ [2,9] | `47 + 28`、`6 × 7` |
| 4 | 两位数加减 + 九九乘法 + 整除 | 除法 a÷b，b∈[2,9]，a 是 b 的倍数 | `72 ÷ 8`、`8 × 9` |
| 5 | 混合四则（单步含括号） | 结果可控，避免过大 | `(8 + 3) × 2` |

**难度 5 仅用于随机挑战困难档**，固定关卡最高到难度 4。

## 7. 关卡设计

### 7.1 50 关难度曲线

| 关段 | 关数 | 颜色数 | 瓶子数 | 空瓶数 | 容量 | 新机制 |
|---|---|---|---|---|---|---|
| 入门 1–10 | 10 | 2–3 | 3–4 | 1 | 4 | 单色合并直觉 |
| 进阶 11–25 | 15 | 3–4 | 4–6 | 1 | 4 | 多色交错 |
| 挑战 26–40 | 15 | 4–5 | 6–8 | 1 | 4 | 局部阻塞 |
| 精通 41–50 | 10 | 5–6 | 8–10 | 1 | 4–5 | 容量 5 瓶出现 |

容量统一为 4，仅第 41 关起出现个别容量 5 的瓶，增加"段长≠容量"的处理难度。

### 7.2 关卡数据组织

```typescript
// src/game/levels.ts
import type { Level, ColorTheme } from './types';

export const LEVELS: readonly Level[] = [
  { id:1, difficulty:1, par:3,
    bottles:[
      {id:0,capacity:4,layers:['c1','c1','c2','c2']},
      {id:1,capacity:4,layers:['c2','c1','c1','c2']},
      {id:2,capacity:4,layers:[]},
    ]},
  // ... 50 关
] as const;

// 难度档主题色板（不同难度配不同色板，避免视觉单调）
// 难度 3/5 的具体色值在实现期填充，此处仅示意档位映射关系
export const COLOR_THEMES: Record<number, ColorTheme> = {
  1: { c1:'#FF6B6B', c2:'#4ECDC4', c3:'#FFE66D', c4:'#A8DADC', c5:'#9B5DE5', c6:'#F15BB5' },
  3: { /* 实现期填充：暖色板 */ },
  5: { /* 实现期填充：冷色板 */ },
};
```

关卡数据 `as const` 冻结，运行时不可变；UI 按 `difficulty` 取主题色板。

### 7.3 关卡进度

线性解锁：玩家通关第 N 关后解锁第 N+1 关。所有固定关卡按 `id` 顺序解锁。随机挑战模式入口**仅在通关第 50 关后从主菜单解锁**，引导玩家先体验精心调优的固定关卡。

## 8. 求解器

### 8.1 接口

```typescript
// src/game/solver.ts
import type { Bottle, SolveStep } from './types';

/**
 * @brief 求解水分类关卡，返回最短解步骤序列
 * @desc BFS 搜索所有合法倒水分支，状态用规范化字符串哈希去重
 * @param bottles 初始局面
 * @param maxNodes 搜索节点上限，默认 200000，超出返回 null
 * @return SolveStep[] 最短解，无解返回 null
 * @note 复杂度 O(节点数 × 瓶子²)；50 关规模实测 <1s
 */
export function solve(
  bottles: readonly Bottle[],
  maxNodes = 200_000
): SolveStep[] | null
```

### 8.2 关键算法点

1. **状态规范化**：瓶子顺序无关（同色瓶子互换是同状态），状态键 = `bottles.map(b => b.layers.join(',')).sort().join('|')`，把搜索空间压缩到同构类
2. **转移生成**：枚举所有 (from, to) 对，过滤合法转移，**一次倒到顶段同色合并到极限**（一次倒满目标瓶顶段或源瓶顶段倒空）——这是求解器版"贪心倒水"，比 UI 一次只倒一段更快搜到最短解
3. **剪枝**：同色瓶子互倒必败，直接跳过；目标瓶顶段颜色不变的状态立即剪
4. **节点上限保护**：`maxNodes` 超限返回 `null`，调用方决定降级（手工关卡保证可解，超限视作求解器能力不足而非关卡无解）

### 8.3 用途

- 离线验证每关有解
- 算最短解步数定 par
- 未来扩展"提示下一步"

## 9. 随机关卡生成器

### 9.1 接口

```typescript
// src/game/generator.ts
import type { Level, GenParams } from './types';

const MAX_ATTEMPTS = 100;

/**
 * @brief 生成一个可解的随机水分类关卡
 * @param params 颜色数/瓶子数/容量/空瓶数/散布步数
 * @return 可解的 Level 对象
 * @note 生成-验证循环：终态逆向打散 → solve() 求 par → 不达标重抽
 * @throw Error 当尝试次数超过 MAX_ATTEMPTS 时抛出
 */
export function generateLevel(params: GenParams): Level
```

### 9.2 生成算法（逆向打散法）

1. 构造**已解终态**：`colorCount` 个瓶子各装 `capacity` 段同色 + `emptyCount` 个空瓶
2. **逆向打散**：从终态出发，随机选合法倒水的"逆操作"（把某瓶顶段任意量移回另一瓶，无视颜色匹配约束）执行 N 次（N = 散布步数）
3. 散布后局面必可解（终态可逆推回它），调 `solve()` 求实际最短解作为 `par`
4. 若 `par < 颜色数 × 1.5`（太简单）或 solver 超时，重抽
5. 超过 `MAX_ATTEMPTS` 抛错

**优势**：正向随机生成后验证常陷入"看起来随机其实 3 步可解"的陷阱；逆向打散从可解态出发，保证可解性且有实际深度。

### 9.3 难度档参数

| 档位 | 颜色 | 瓶子 | 容量 | 空瓶 | 散布步数 |
|---|---|---|---|---|---|
| 简单 | 3 | 4 | 4 | 1 | 8–12 |
| 中等 | 4 | 6 | 4 | 1 | 14–20 |
| 困难 | 5 | 8 | 4 | 1 | 22–30 |

## 10. 口算题生成器

### 10.1 接口

```typescript
// src/game/mathquiz.ts
import type { Difficulty, MathQuestion } from './types';

/**
 * @brief 按难度档生成一道口算题
 * @param difficulty 关卡难度 1–5
 * @param seed 可选随机种子，用于复现
 * @return MathQuestion 含题目文本/答案/操作数/运算符
 * @note 纯函数无副作用，给定 seed 可复现
 * @throw RangeError 当 difficulty 不在 [1,5] 时
 */
export function generateQuestion(
  difficulty: Difficulty,
  seed?: number
): MathQuestion
```

### 10.2 题型按难度档分配

| 难度 | 题型 | 数值约束 | 示例 |
|---|---|---|---|
| 1 | 10 以内加减 | a,b ∈ [0,10]，减法结果 ≥0 | `3 + 4`、`8 − 2` |
| 2 | 20 以内加减 | a,b ∈ [0,20]，减法结果 ≥0 | `15 − 7`、`9 + 6` |
| 3 | 99 以内加减 + 乘法表局部 | 加减 a,b ∈ [0,99]；乘法 a,b ∈ [2,9] | `47 + 28`、`6 × 7` |
| 4 | 两位数加减 + 九九乘法 + 整除 | 除法 a÷b，b∈[2,9]，a 是 b 的倍数 | `72 ÷ 8`、`8 × 9` |
| 5 | 混合四则（单步含括号） | 结果可控，避免过大 | `(8 + 3) × 2` |

### 10.3 算法核心约束

- 减法不出现负数：`a ≥ b` 时才生成 `a − b`
- 除法必整除：先选 `b ∈ [2,9]`，再选 `k ∈ [1,9]`，`a = b × k`，出题 `a ÷ b`
- 乘法结果 ≤ 81（九九表内）
- 难度 3 起按 50/30/20 概率分布加减/乘/除（避免乘除过多挫败感）
- 同一次答题会话内尽量不连续出同题型

## 11. 持久化

### 11.1 存档结构

```typescript
// src/persistence.ts
const STORAGE_KEY = 'bottle-game:v1';
const SCHEMA_VERSION = 1;

interface SaveData {
  version: number;            // SCHEMA_VERSION
  progress: {
    unlockedLevelId: number;  // 已解锁到第几关（线性解锁）
    lastPlayedId: number;     // 上次玩的关
  };
  records: Record<number, LevelRecord>;  // 关卡 ID -> 最佳成绩
  settings: {
    soundEnabled: boolean;
    reducedMotion: boolean;   // 跟随系统 prefers-reduced-motion
  };
}

interface LevelRecord {
  bestMoves: number | null;
  bestTimeMs: number | null;
  stars: 0 | 1 | 2 | 3;
}
```

### 11.2 评级规则

- 步数 ≤ par → ⭐⭐⭐
- 步数 ≤ par × 1.3 → ⭐⭐
- 通关即可 → ⭐

### 11.3 API

```typescript
export function loadSave(): SaveData | null
export function saveSave(data: SaveData): void
export function clearSave(): void
export function migrateSave(raw: unknown): SaveData | null
```

### 11.4 容错

- 读取失败/quota 超限 → 降级到内存临时状态 + console.warn，不阻塞游戏
- 写入用 try/catch 包裹，不抛错（最坏情况玩家这次进度不存）
- 启动时校验 schema 版本，老版本走 `migrateSave`

## 12. 测试方案

### 12.1 单元测试（Vitest，覆盖率目标 80%+）

| 模块 | 覆盖重点 |
|---|---|
| `game/reducer.ts` | 倒水规则正确性、撤销快照、胜利判定、非法操作拒绝 |
| `game/solver.ts` | 最小用例已知解、不可解返回 null、节点上限保护 |
| `game/generator.ts` | 三档各 100 关可解、par 落区间、MAX_ATTEMPTS 抛错 |
| `game/mathquiz.ts` | 每档 1000 题：答案正确、减法非负、除法整除、seed 复现 |
| `game/levels.ts` | 数据冻结、字段完整性 |
| `persistence.ts` | 读写往返、老版本迁移、quota 失败降级 |

### 12.2 集成测试

```typescript
// tests/integration/reducer+solver.test.ts
// 随机生成关卡 → solve → 用 reducer 重放解 → 断言 status='won'
// 验证"求解器算出的解真的能在 UI 状态机里走通"
```

### 12.3 E2E（Playwright，仅关键路径）

- 启动 → 看到第 1 关 → 点瓶子完成倒水 → 通关跳"下一关"
- 关闭浏览器重开 → 进度仍在
- 点"撤销"按钮 → 弹口算题 → 答对 → 撤销生效

### 12.4 离线校验脚本

`scripts/verify-all.ts`（构建前/CI 跑）：

```
对 LEVELS 全部 50 关：
  sol = solve(level.bottles)
  assert sol !== null
  assert sol.length <= level.par * 1.5
  console.log(`关卡 ${id}: 最短 ${sol.length} 步，par ${level.par}`)

对每档难度生成 100 个随机关卡：
  sol = solve(level.bottles)
  assert sol !== null
  assert par 在期望区间

对每档难度生成 1000 道口算题：
  assert 答案正确
  assert 数值约束满足
```

独立于 Vitest 套件，避免拖慢日常开发反馈循环。

## 13. 脚手架总览

```
bottle-game/
├── public/
│   └── favicon.svg
├── scripts/
│   └── verify-all.ts              # 离线校验脚本
├── src/
│   ├── game/                      # 纯逻辑层（零 React 依赖）
│   │   ├── types.ts               # Bottle/Level/GameState/MathQuestion/...
│   │   ├── reducer.ts             # 倒水/撤销/重置状态机
│   │   ├── solver.ts              # BFS 求解器
│   │   ├── generator.ts           # 随机关卡生成器
│   │   ├── mathquiz.ts            # 口算题生成器
│   │   └── levels.ts              # 50 关固定数据 + 主题色板
│   ├── components/
│   │   ├── Bottle.tsx             # 单瓶（SVG 液体 + CSS 玻璃外壳）
│   │   ├── Board.tsx              # 棋盘响应式布局
│   │   ├── HUD.tsx                # 步数/计时/按钮
│   │   ├── LevelSelect.tsx        # 关卡选择
│   │   ├── Menu.tsx               # 主菜单
│   │   ├── MathQuizModal.tsx      # 口算题弹窗
│   │   └── VictoryOverlay.tsx     # 通关庆祝层
│   ├── store/
│   │   └── useGameStore.ts        # Zustand store（薄包装 reducer）
│   ├── hooks/
│   │   ├── useTimer.ts            # 计时器
│   │   └── useKeyboard.ts         # PC 键盘 0-9/退格/回车
│   ├── styles/
│   │   ├── globals.css            # reset + 变量 + 主题
│   │   ├── bottle.css             # 瓶子/液体样式
│   │   └── responsive.css         # 媒体查询
│   ├── persistence.ts             # localStorage 读写 + 迁移
│   ├── App.tsx                    # 路由：菜单/游戏/选择
│   ├── main.tsx                   # 挂载点
│   └── vite-env.d.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│       └── play.spec.ts
├── index.html
├── package.json
├── tsconfig.json                  # 严格模式 + noUncheckedIndexedAccess
├── vite.config.ts
└── vitest.config.ts
```

## 14. 依赖清单

| 类别 | 包 | 用途 |
|---|---|---|
| 框架 | react, react-dom | UI |
| 状态 | zustand | 轻量 store |
| 构建 | vite, @vitejs/plugin-react | 开发/打包 |
| 类型 | typescript, @types/react, @types/react-dom | 类型 |
| 测试 | vitest, @testing-library/react, jsdom | 单元/集成 |
| E2E | @playwright/test | 端到端（可选） |

**刻意不引**：UI 库（shadcn/MUI）、Redux/RTK、动画库（framer-motion——CSS transition 已够）、游戏引擎（Phaser）。

## 15. 构建与部署

- **开发**：`pnpm dev` → Vite dev server，HMR
- **构建**：`pnpm build` → `dist/` 纯静态站
- **部署**：
  - 主推 Vercel/Netlify（拖拽 dist/ 即上线）
  - 备选 GitHub Pages（`base: '/repo-name/'` 配置）
  - 不需要服务端，零运维成本

## 16. tsconfig 严格约束

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true
  }
}
```

`noUncheckedIndexedAccess` 对 `layers[0]` 之类的访问强制处理 undefined，防越界崩溃。
