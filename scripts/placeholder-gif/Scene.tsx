import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {CHARACTER_FPS, CHARACTER_FRAMES, Ghost, Snowman} from './Characters';

// A tiny looping line-art scene (steaming mug + swaying tulips) used to make the
// placeholder transparent GIF. Replace public/gifs/cozy.gif with your own art.
// Calm on purpose: a 4-second loop at 20 fps with small, smooth movements and no fading.
const FPS = 20;
const FRAMES = 80;
const INK = '#1d1d1d';

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (frame / FRAMES) * Math.PI * 2;
  // Steam stays visible and just drifts gently side to side and up/down.
  const steam = (dx: number, phase: number) => {
    const x = dx + Math.sin(t + phase) * 4;
    const y = 300 + Math.sin(t * 2 + phase) * 3;
    return (
      <path
        d={`M${x} ${y} c-12 -16 12 -28 0 -44 c-12 -16 12 -28 0 -44`}
        fill="none"
        stroke={INK}
        strokeWidth={6}
        strokeLinecap="round"
      />
    );
  };
  const tulip = (x: number, h: number, phase: number, color: string) => (
    <g transform={`rotate(${Math.sin(t + phase) * 2.5} 420 470)`}>
      <path d={`M420 470 Q${x - 6} ${470 - h / 2} ${x} ${470 - h}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path
        d={`M${x - 26} ${470 - h} q-4 -40 14 -46 l12 16 l12 -16 q18 6 14 46 q-26 18 -52 0 z`}
        fill={color}
        stroke={INK}
        strokeWidth={5}
        strokeLinejoin="round"
      />
    </g>
  );
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 600 600" width={600} height={600}>
        {/* table */}
        <path d="M60 520 L560 520" stroke={INK} strokeWidth={7} strokeLinecap="round" />
        <path d="M110 520 L100 590 M510 520 L520 590" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        {/* vase + tulips */}
        {tulip(380, 150, 0, '#f6b8d1')}
        {tulip(430, 190, 1.4, '#f9c9dc')}
        {tulip(470, 140, 2.6, '#f6b8d1')}
        <path d="M395 520 L388 470 Q420 450 452 470 L445 520 Z" fill="#ffffff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* mug */}
        <path d="M150 400 L160 515 Q200 528 240 515 L250 400 Z" fill="#cfe5d6" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M248 425 q42 0 40 36 q-2 34 -44 30" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <ellipse cx={200} cy={400} rx={50} ry={10} fill="#8a5a3c" stroke={INK} strokeWidth={6} />
        <circle cx={183} cy={455} r={4.5} fill={INK} />
        <circle cx={217} cy={455} r={4.5} fill={INK} />
        <path d="M188 470 q12 10 24 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <ellipse cx={174} cy={468} rx={8} ry={4.5} fill="#f4a7b9" />
        <ellipse cx={226} cy={468} rx={8} ry={4.5} fill="#f4a7b9" />
        {/* steam */}
        {steam(185, 0)}
        {steam(215, 2.1)}
      </svg>
    </AbsoluteFill>
  );
};

registerRoot(() => (
  <>
    <Composition id="PlaceholderGif" component={Scene} durationInFrames={FRAMES} fps={FPS} width={600} height={600} />
    <Composition id="Ghost" component={Ghost} durationInFrames={CHARACTER_FRAMES} fps={CHARACTER_FPS} width={480} height={520} />
    <Composition id="Snowman" component={Snowman} durationInFrames={CHARACTER_FRAMES} fps={CHARACTER_FPS} width={500} height={580} />
  </>
));
