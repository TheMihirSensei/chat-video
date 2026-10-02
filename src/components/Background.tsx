import React from 'react';
import {AbsoluteFill, Html5Video, Img} from 'remotion';
import {resolveSrc} from '../assets';
import type {Theme} from '../theme';
import {BlobFill} from './Blob';
import {PANEL_WOBBLE_FILTER} from './Wobble';

export const Background: React.FC<{background: Theme['background']}> = ({background: bg}) => {
  const media: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: bg.blur ? `blur(${bg.blur}px)` : undefined,
    transform: bg.blur ? 'scale(1.05)' : undefined,
  };
  return (
    <AbsoluteFill style={{background: bg.type === 'gradient' ? bg.gradient : bg.color}}>
      {bg.type === 'image' && bg.src && <Img src={resolveSrc(bg.src)} style={media} />}
      {bg.type === 'video' && bg.src && <Html5Video src={resolveSrc(bg.src)} style={media} loop muted />}
      {bg.overlay && <AbsoluteFill style={{background: bg.overlay}} />}
      {bg.panel?.shape === 'blob' && (
        <div style={{position: 'absolute', inset: bg.panel.inset}}>
          <BlobFill
            background={bg.panel.color}
            options={{
              radius: bg.panel.radius,
              amplitude: bg.panel.wobble,
              waveLength: bg.panel.waveLength ?? 600,
              irregular: 0.5,
              seed: 7,
            }}
          />
        </div>
      )}
      {bg.panel && bg.panel.shape !== 'blob' && (
        <div
          style={{
            position: 'absolute',
            inset: bg.panel.inset,
            background: bg.panel.color,
            borderRadius: bg.panel.radius,
            filter: bg.panel.wobble ? PANEL_WOBBLE_FILTER : undefined,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
