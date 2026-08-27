// src/components/Bottle.tsx
import { memo } from 'react';
import type { Bottle as BottleData, Difficulty } from '../game/types';
import '../styles/bottle.css';

interface Props {
  bottle: BottleData;
  selected: boolean;
  difficulty: Difficulty;
  shake?: boolean;
  onClick: () => void;
}

export const Bottle = memo(function Bottle({ bottle, selected, shake, onClick }: Props) {
  const segments = mergeSegments(bottle.layers);
  const capacity = bottle.capacity;
  return (
    <div
      className={['bottle', selected ? 'selected' : '', shake ? 'shake' : ''].filter(Boolean).join(' ')}
      onClick={onClick}
      role="button"
      aria-pressed={selected}
      aria-label={`瓶子 ${bottle.id + 1}`}
    >
      <svg className="bottle__liquid" viewBox="0 0 100 100" preserveAspectRatio="none">
        {segments.map((seg, i) => {
          const top = computeTopY(seg.cumulativeEnd, capacity);
          const bottom = computeTopY(seg.cumulativeStart, capacity);
          const color = seg.color;
          return (
            <path
              key={i}
              d={`M0,${top} L0,${bottom} L100,${bottom} L100,${top} Q50,${top - 2} 0,${top} Z`}
              fill={color}
            />
          );
        })}
      </svg>
    </div>
  );
});

interface Segment {
  color: string;
  cumulativeStart: number; // 该段底部在瓶中位置（0=底）
  cumulativeEnd: number;
}

/** @brief 把 layers 合并为连续同色段（layers 已是同色合并存储，但仍防御性合并） */
function mergeSegments(layers: string[]): Segment[] {
  const segs: Segment[] = [];
  let cursor = 0;
  for (let i = 0; i < layers.length; ) {
    const color = layers[i]!;
    let j = i + 1;
    while (j < layers.length && layers[j] === color) j++;
    const len = j - i;
    segs.push({ color, cumulativeStart: cursor, cumulativeEnd: cursor + len });
    cursor += len;
    i = j;
  }
  return segs;
}

function computeTopY(cumulative: number, capacity: number): number {
  // viewBox 0=瓶顶, 100=瓶底；cumulative=0 → y=100, cumulative=capacity → y=100-capacity占满
  return 100 - (cumulative / capacity) * 100;
}
