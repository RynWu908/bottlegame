// src/components/Bottle.tsx
import { memo } from 'react';
import type { Bottle as BottleData, Difficulty } from '../game/types';
import '../styles/bottle.css';

interface Props {
  bottle: BottleData;
  selected: boolean;
  difficulty: Difficulty;
  shake?: boolean;
  pouring?: boolean;
  onClick: () => void;
}

export const Bottle = memo(function Bottle({ bottle, selected, shake, pouring, onClick }: Props) {
  const segments = mergeSegments(bottle.layers);
  const capacity = bottle.capacity;
  const completed = isCompleted(bottle);
  const topColor = bottle.layers.length > 0 ? bottle.layers[bottle.layers.length - 1] : null;

  const cls = ['bottle'];
  if (selected) cls.push('selected');
  if (shake) cls.push('shake');
  if (completed) cls.push('completed');

  return (
    <div
      className={cls.join(' ')}
      onClick={onClick}
      role="button"
      aria-pressed={selected}
      aria-label={`瓶子 ${bottle.id + 1}`}
    >
      <div className="bottle__liquid">
        {segments.map((seg, i) => {
          const bottomPct = (seg.cumulativeStart / capacity) * 100;
          const heightPct = ((seg.cumulativeEnd - seg.cumulativeStart) / capacity) * 100;
          const isTop = i === segments.length - 1;
          return (
            <div
              key={i}
              className={`bottle__liquid-seg${isTop ? ' bottle__liquid-seg--top' : ''}`}
              style={{
                bottom: `${bottomPct}%`,
                height: `${heightPct}%`,
                background: seg.color,
              }}
            />
          );
        })}
      </div>
      {pouring && topColor && (
        <div className="bottle__droplet" style={{ background: topColor }} />
      )}
    </div>
  );
});

interface Segment {
  color: string;
  cumulativeStart: number;
  cumulativeEnd: number;
}

/** @brief 把 layers 合并为连续同色段 */
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

/** @brief 判断瓶子是否完成（空瓶或满瓶单色） */
function isCompleted(b: BottleData): boolean {
  if (b.layers.length === 0) return true;
  if (b.layers.length !== b.capacity) return false;
  const first = b.layers[0];
  if (first === undefined) return false;
  return b.layers.every(c => c === first);
}
