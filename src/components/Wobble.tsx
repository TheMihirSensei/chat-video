import React from 'react';
import type {Theme} from '../theme';

export const WOBBLE_VARIANTS = 6;

/** CSS filter value giving an element hand-drawn, slightly uneven edges. */
export const wobbleFilter = (strength: number, seed: number) =>
  strength > 0 ? `url(#wobble-${seed % WOBBLE_VARIANTS})` : undefined;

export const PANEL_WOBBLE_FILTER = 'url(#wobble-panel)';

const Filter: React.FC<{id: string; frequency: number; scale: number; seed: number}> = ({id, frequency, scale, seed}) => (
  // userSpaceOnUse + a big region so displaced edges and tails outside the box never clip.
  <filter id={id} filterUnits="userSpaceOnUse" x={-2000} y={-2000} width={8000} height={8000}>
    <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={1} seed={seed} result="noise" />
    <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} xChannelSelector="R" yChannelSelector="G" />
  </filter>
);

/**
 * SVG displacement filters for the wobbly "hand-drawn" look. The noise is static
 * and in the element's own coordinates, so edges don't shimmer while scrolling.
 */
export const WobbleFilters: React.FC<{theme: Theme}> = ({theme}) => {
  const panel = theme.background.panel;
  if (!theme.bubble.wobble && !panel?.wobble) return null;
  // Blob shapes draw their own outline and don't need the filters.
  return (
    <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
      <defs>
        {Array.from({length: WOBBLE_VARIANTS}, (_, i) => (
          <Filter key={i} id={`wobble-${i}`} frequency={theme.bubble.wobbleFrequency ?? 0.012} scale={theme.bubble.wobble} seed={i * 7 + 3} />
        ))}
        {panel && <Filter id="wobble-panel" frequency={panel.wobbleFrequency ?? 0.0035} scale={panel.wobble} seed={11} />}
      </defs>
    </svg>
  );
};
