import React from 'react';
import {Html5Audio, Sequence, useVideoConfig} from 'remotion';
import {resolveSrc} from '../assets';
import type {Theme} from '../theme';
import type {Timeline} from '../timing';
import type {Message} from '../types';

export const Sounds: React.FC<{theme: Theme; timeline: Timeline; messages: Message[]}> = ({
  theme,
  timeline,
  messages,
}) => {
  const {fps} = useVideoConfig();
  const {sounds, music} = theme;
  return (
    <>
      {music.src && <Html5Audio src={resolveSrc(music.src)} volume={music.volume} loop />}
      {timeline.items.map((item, i) => {
        const effect = messages[i].from === 'A' ? sounds.sent : sounds.received;
        return (
          <React.Fragment key={i}>
            {sounds.typing && item.showTyping && item.appear > item.typingStart && (
              <Sequence from={item.typingStart} durationInFrames={item.appear - item.typingStart} layout="none">
                <Html5Audio src={resolveSrc(sounds.typing)} volume={sounds.volume} loop />
              </Sequence>
            )}
            {effect && (
              <Sequence from={item.appear} durationInFrames={fps * 2} layout="none">
                <Html5Audio src={resolveSrc(effect)} volume={sounds.volume} />
              </Sequence>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};
