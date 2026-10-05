import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

// Looping placeholder characters for lesson videos (rendered to transparent GIFs).
// Replace public/characters/*.gif with your own art.
//
// Kept deliberately calm: slow 4-second loops at 20 fps, small movements, and no
// fading (GIF pixels are either fully opaque or fully transparent, so fades flash).
export const CHARACTER_FPS = 20;
export const CHARACTER_FRAMES = 80;
const INK = '#151515';

const loop = (frame: number) => (frame / CHARACTER_FRAMES) * Math.PI * 2;

export const Ghost: React.FC = () => {
  const frame = useCurrentFrame();
  const t = loop(frame);
  const float = Math.sin(t) * 4;
  // Only a gentle float. No blinking: the eyes stay the same in every frame.
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 240 260" width={480} height={520}>
        <g transform={`translate(15 ${8 + float})`}>
          <path
            d="M104 12 C48 12 28 62 28 112 L25 192 C23 208 34 218 46 212 C56 226 72 226 80 214 C90 228 106 228 114 214 C124 228 142 226 148 212 C162 222 186 216 194 202 C180 192 176 172 176 150 L178 112 C178 56 158 12 104 12 Z"
            fill="#fff"
            stroke={INK}
            strokeWidth={7}
            strokeLinejoin="round"
          />
          <ellipse cx={62} cy={112} rx={12} ry={7} fill="#f6b3c2" opacity={0.85} />
          <ellipse cx={146} cy={112} rx={12} ry={7} fill="#f6b3c2" opacity={0.85} />
          <path d="M60 92 L90 94" stroke={INK} strokeWidth={7} strokeLinecap="round" />
          <path d="M118 94 L148 92" stroke={INK} strokeWidth={7} strokeLinecap="round" />
          <path d="M66 94 Q75 102 84 94 Z" fill={INK} />
          <path d="M124 94 Q133 102 142 94 Z" fill={INK} />
          <path d="M93 106 Q98 114 104 106 Q110 114 115 106" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M74 168 Q92 158 104 138 Q116 158 134 168" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M82 178 Q96 172 104 156 Q112 172 126 178" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const Snowman: React.FC = () => {
  const frame = useCurrentFrame();
  const t = loop(frame);
  const wave = Math.sin(t) * 6; // right arm waves slowly, once per loop
  const sway = Math.sin(t) * 1.5; // head tilts very slightly
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 250 290" width={500} height={580}>
        <defs>
          <clipPath id="body">
            <ellipse cx={125} cy={204} rx={84} ry={76} />
          </clipPath>
        </defs>
        <g stroke="#1a1a1a" strokeWidth={4} strokeLinecap="round" fill="none">
          <path d="M56 172 L16 116 M33 140 L8 132 M26 130 L30 104" />
          <g transform={`rotate(${wave} 194 168)`}>
            <path d="M194 168 L234 114 M216 140 L242 134 M222 126 L218 100" />
          </g>
        </g>
        <ellipse cx={125} cy={204} rx={84} ry={76} fill="#d4e6f5" />
        <ellipse cx={113} cy={196} rx={80} ry={74} fill="#fff" clipPath="url(#body)" />
        <ellipse cx={125} cy={204} rx={84} ry={76} fill="none" stroke="#1a1a1a" strokeWidth={4} />
        <path d="M74 140 Q125 162 176 140 L172 128 Q125 148 78 128 Z" fill="#d4e6f5" />
        <g transform={`rotate(${sway} 125 130)`}>
          <circle cx={125} cy={86} r={54} fill="#d4e6f5" />
          <circle cx={116} cy={80} r={50} fill="#fff" />
          <circle cx={125} cy={86} r={54} fill="none" stroke="#1a1a1a" strokeWidth={4} />
          <ellipse cx={104} cy={76} rx={5} ry={7} fill="#1a1a1a" />
          <ellipse cx={138} cy={73} rx={5} ry={7} fill="#1a1a1a" />
          <path d="M120 92 L160 84 L122 102 Z" fill="#f28a2e" stroke="#1a1a1a" strokeWidth={3} strokeLinejoin="round" />
          <path d="M104 110 Q120 120 138 108" fill="none" stroke="#1a1a1a" strokeWidth={3.5} strokeLinecap="round" />
        </g>
        <path d="M8 284 Q28 272 48 280 Q74 268 100 280 Q130 270 156 280 Q186 270 212 280 Q230 272 244 284" fill="none" stroke="#1a1a1a" strokeWidth={3.5} strokeLinecap="round" />
      </svg>
    </AbsoluteFill>
  );
};
