import React from 'react';
import type {Theme} from '../theme';
import type {PersonId} from '../types';
import {BubbleShape, bubbleFilter, bubbleRadius, tailSpace} from './Bubble';

export const TypingIndicator: React.FC<{
  theme: Theme;
  side: PersonId;
  /** Frames since the indicator appeared (drives the dot animation). */
  frame: number;
  fps: number;
  showTail: boolean;
  groupedPrev: boolean;
  seed?: number;
  style?: React.CSSProperties;
}> = ({theme, side, frame, fps, showTail, groupedPrev, seed = 0, style}) => {
  const b = theme.bubble;
  const t = theme.typing;
  const colors = b[side];
  const background = t.background ?? colors.background;
  const tailBackground = t.background ?? colors.tailColor ?? colors.background;
  const seconds = frame / fps;

  const dots = [0, 1, 2].map((i) => {
    const phase = (((seconds * t.speed - i * 0.18) % 1) + 1) % 1;
    const wave = Math.sin(phase * Math.PI * 2);
    const up = Math.max(0, wave);
    let dotStyle: React.CSSProperties;
    if (t.style === 'pulse') dotStyle = {opacity: 0.3 + 0.7 * (0.5 + 0.5 * wave)};
    else if (t.style === 'wave') dotStyle = {transform: `scale(${0.6 + 0.4 * (0.5 + 0.5 * wave)})`, opacity: 0.55 + 0.45 * up};
    else dotStyle = {transform: `translateY(${-up * t.dotSize * 0.55}px)`, opacity: 0.45 + 0.55 * up};
    return (
      <div
        key={i}
        style={{width: t.dotSize, height: t.dotSize, borderRadius: '50%', background: t.dotColor, ...dotStyle}}
      />
    );
  });

  if (!t.bubble) {
    // Just the dots, floating (used next to an avatar).
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: t.dotGap,
          height: t.dotSize * 3,
          padding: `0 ${t.dotGap}px`,
          transformOrigin: side === 'A' ? 'right' : 'left',
          ...style,
        }}
      >
        {dots}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        marginBottom: tailSpace(theme, showTail),
        filter: bubbleFilter(theme, colors),
        transformOrigin: `${b.tailPosition === 'first' ? 'top' : 'bottom'} ${side === 'A' ? 'right' : 'left'}`,
        ...style,
      }}
    >
      <BubbleShape
        theme={theme}
        side={side}
        background={background}
        tailBackground={tailBackground}
        border={colors.border}
        radius={bubbleRadius(theme, side, {groupedPrev, groupedNext: false, showTail})}
        showTail={showTail}
        seed={seed}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: t.dotGap,
          // Same height as a one-line message bubble.
          height: b.fontSize * b.lineHeight,
          padding: `${b.paddingY}px ${b.paddingX}px`,
          boxSizing: 'content-box',
        }}
      >
        {dots}
      </div>
    </div>
  );
};
