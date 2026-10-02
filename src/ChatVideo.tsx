import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Background} from './components/Background';
import {ChatArea} from './components/ChatArea';
import {Header} from './components/Header';
import {Sounds} from './components/Sounds';
import {WobbleFilters} from './components/Wobble';
import {fontStack, useFonts} from './fonts';
import {resolveTheme, type Theme} from './theme';
import {computeTimeline, type Timeline} from './timing';
import type {ChatProps} from './types';

const PHONE_ASPECT = 19.5 / 9;
const NOTCH_INSET = 110;

/** Header + chat, laid out at `width` x `height` design pixels. */
const Screen: React.FC<{
  chat: ChatProps;
  theme: Theme;
  timeline: Timeline;
  width: number;
  height: number;
  topInset: number;
}> = ({chat, theme, timeline, width, height, topInset}) => {
  const frame = useCurrentFrame();
  const typingB = timeline.items.some(
    (item, i) => chat.messages[i].from === 'B' && item.showTyping && frame >= item.typingStart && frame < item.appear,
  );
  const headerHeight = theme.header.show ? theme.header.height + topInset : topInset;
  return (
    <div style={{position: 'relative', width, height, overflow: 'hidden'}}>
      <ChatArea chat={chat} theme={theme} timeline={timeline} width={width} top={headerHeight} />
      {theme.header.show && <Header theme={theme} person={chat.people.B} typing={typingB} topInset={topInset} />}
    </div>
  );
};

export const ChatVideo: React.FC<ChatProps> = (chat) => {
  const {fps, width, height} = useVideoConfig();
  const theme = useMemo(() => resolveTheme(chat.theme), [chat.theme]);
  const timeline = useMemo(() => computeTimeline(chat.messages, theme, fps), [chat.messages, theme, fps]);
  const sampleText = useMemo(
    () =>
      [
        ...chat.messages.map((m) => m.text),
        chat.people.A.name,
        chat.people.B.name,
        theme.header.onlineText,
        theme.header.typingText,
        theme.header.title ?? '',
        '0123456789:APM',
      ].join(' '),
    [chat, theme],
  );
  const fontsReady = useFonts(theme, sampleText);
  const frameTheme = theme.phoneFrame;

  let content: React.ReactNode = null;
  if (fontsReady) {
    if (frameTheme.show) {
      // Fit a phone of fixed aspect ratio inside the canvas, then scale the
      // design-size screen content down into it.
      let screenH = height - frameTheme.margin * 2 - frameTheme.bezel * 2;
      let screenW = screenH / PHONE_ASPECT;
      const maxW = width - frameTheme.margin * 2 - frameTheme.bezel * 2;
      if (screenW > maxW) {
        screenW = maxW;
        screenH = screenW * PHONE_ASPECT;
      }
      const scale = screenW / frameTheme.contentWidth;
      const designH = screenH / scale;
      const screenRadius = Math.max(0, frameTheme.radius - frameTheme.bezel);
      content = (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div
            style={{
              padding: frameTheme.bezel,
              background: frameTheme.color,
              borderRadius: frameTheme.radius,
              boxShadow: frameTheme.shadow ?? undefined,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: screenW,
                height: screenH,
                borderRadius: screenRadius,
                overflow: 'hidden',
                transform: 'translateZ(0)',
              }}
            >
              <Background background={theme.background} />
              <div style={{transform: `scale(${scale})`, transformOrigin: 'top left'}}>
                <Screen
                  chat={chat}
                  theme={theme}
                  timeline={timeline}
                  width={frameTheme.contentWidth}
                  height={designH}
                  topInset={frameTheme.notch ? NOTCH_INSET : 0}
                />
              </div>
              {frameTheme.notch && (
                <div
                  style={{
                    position: 'absolute',
                    top: 18 * scale,
                    left: '50%',
                    width: 300 * scale,
                    height: 84 * scale,
                    marginLeft: -150 * scale,
                    borderRadius: 999,
                    background: '#000',
                    zIndex: 20,
                  }}
                />
              )}
            </div>
          </div>
        </AbsoluteFill>
      );
    } else {
      const columnW = Math.min(width, theme.layout.chatMaxWidth);
      content = (
        <AbsoluteFill style={{alignItems: 'center'}}>
          <Screen chat={chat} theme={theme} timeline={timeline} width={columnW} height={height} topInset={0} />
        </AbsoluteFill>
      );
    }
  }

  return (
    <AbsoluteFill style={{fontFamily: fontStack(theme)}}>
      <WobbleFilters theme={theme} />
      {frameTheme.show ? (
        <Background background={{...theme.background, overlay: theme.background.overlay ?? 'rgba(0,0,0,0.35)', blur: 30}} />
      ) : (
        <Background background={theme.background} />
      )}
      {content}
      <Sounds theme={theme} timeline={timeline} messages={chat.messages} />
    </AbsoluteFill>
  );
};
