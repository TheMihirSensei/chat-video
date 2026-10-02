import type {CSSProperties} from 'react';
import {interpolate, spring} from 'remotion';
import type {Entrance} from '../theme';
import type {PersonId} from '../types';

/** Transform/opacity for a bubble `local` frames after it starts entering. */
export const entranceStyle = (
  entrance: Entrance,
  local: number,
  fps: number,
  side: PersonId,
): Pick<CSSProperties, 'transform' | 'opacity'> => {
  if (local < 0) return {opacity: 0, transform: 'scale(0)'};
  const dir = side === 'A' ? 1 : -1;
  switch (entrance) {
    case 'slide': {
      const s = spring({frame: local, fps, config: {damping: 200, stiffness: 160}});
      return {
        transform: `translateX(${(1 - s) * 160 * dir}px)`,
        opacity: interpolate(local, [0, 6], [0, 1], {extrapolateRight: 'clamp'}),
      };
    }
    case 'fade': {
      const s = spring({frame: local, fps, config: {damping: 200}});
      return {
        transform: `translateY(${(1 - s) * 30}px)`,
        opacity: interpolate(local, [0, 9], [0, 1], {extrapolateRight: 'clamp'}),
      };
    }
    case 'bounce': {
      const s = spring({frame: local, fps, config: {damping: 7, stiffness: 160, mass: 0.7}});
      return {transform: `scale(${s})`, opacity: interpolate(local, [0, 3], [0, 1], {extrapolateRight: 'clamp'})};
    }
    case 'pop':
    default: {
      const s = spring({frame: local, fps, config: {damping: 13, stiffness: 220, mass: 0.6}});
      return {
        transform: `scale(${interpolate(s, [0, 1], [0.4, 1])})`,
        opacity: interpolate(local, [0, 4], [0, 1], {extrapolateRight: 'clamp'}),
      };
    }
  }
};
