import React from 'react';
import type {TailStyle} from '../theme';
import type {PersonId} from '../types';

/** Corner radius used on the bubble corner the tail attaches to. */
export const TAIL_CORNER_RADIUS = {first: 0, last: 8};

const tailPath = (style: TailStyle, position: 'first' | 'last', s: number) => {
  // Drawn for the right-hand (A) side; the bubble edge is the box's left edge (x = 0).
  if (position === 'first') {
    return style === 'triangle'
      ? `M0 0 L${s} 0 L0 ${s} Z`
      : `M0 0 L${s} 0 Q${s * 0.35} ${s * 0.2} 0 ${s} Z`;
  }
  return style === 'triangle'
    ? `M0 0 L${s} ${s} L0 ${s} Z`
    : `M0 0 Q${s * 0.2} ${s * 0.65} ${s} ${s} L0 ${s} Z`;
};

/** How far a speech tail reaches below the bubble. */
export const speechTailDepth = (size: number) => size * 1.5 - SPEECH_OVERLAP;
const SPEECH_OVERLAP = 8;

export const Tail: React.FC<{
  side: PersonId;
  style: TailStyle;
  position: 'first' | 'last';
  size: number;
  /** speech tail only: distance from the bubble's outer edge. */
  inset?: number;
  background: string;
}> = ({side, style, position, size, inset = 60, background}) => {
  if (style === 'none') return null;
  if (style === 'speech') {
    // Comic spike under the bubble. Drawn for A (inner edge on the left, curving
    // out to the right) and mirrored for B. The top overlaps into the bubble.
    const h = size * 1.5;
    return (
      <div
        style={{
          position: 'absolute',
          width: size,
          height: h,
          bottom: -(h - SPEECH_OVERLAP),
          [side === 'A' ? 'right' : 'left']: inset,
          background,
          clipPath: `path('M0 0 L${size * 0.08} ${h} Q${size * 0.38} ${h * 0.38} ${size} 0 Z')`,
          transform: side === 'B' ? 'scaleX(-1)' : undefined,
        }}
      />
    );
  }
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        [position === 'first' ? 'top' : 'bottom']: 0,
        [side === 'A' ? 'right' : 'left']: -(size - 1),
        background,
        clipPath: `path('${tailPath(style, position, size)}')`,
        transform: side === 'B' ? 'scaleX(-1)' : undefined,
      }}
    />
  );
};
