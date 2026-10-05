import React from 'react';
import {AnimatedImage, Html5Video, Img} from 'remotion';
import {resolveSrc} from '../assets';

/**
 * Renders an animated GIF (frame-accurate, looping), a video (.webm with transparency
 * works), or a still image, picked by file extension. Wrap it in a <Sequence> to
 * control when an animation starts.
 *
 * GIFs use Remotion's <AnimatedImage>, which holds the render until each frame is
 * drawn. (<Gif> from @remotion/gif draws only after measuring its on-screen size, which
 * can happen after a frame is captured, so characters would randomly vanish for a frame.)
 */
export const MediaFile: React.FC<{
  src: string;
  fit?: 'contain' | 'cover' | 'fill';
  speed?: number;
  style?: React.CSSProperties;
}> = ({src, fit = 'contain', speed = 1, style}) => {
  const url = resolveSrc(src);
  const ext = src.split('?')[0].split('.').pop()!.toLowerCase();
  const css: React.CSSProperties = {width: '100%', height: '100%', objectFit: fit, display: 'block', ...style};
  if (ext === 'gif') {
    return <AnimatedImage src={url} fit={fit} playbackRate={speed} loopBehavior="loop" style={css} />;
  }
  if (['webm', 'mp4', 'mov', 'm4v'].includes(ext)) return <Html5Video src={url} style={css} loop muted playbackRate={speed} />;
  return <Img src={url} style={css} />;
};
