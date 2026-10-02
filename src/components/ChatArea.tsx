import React, {useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../theme';
import {messageTime, type Timeline} from '../timing';
import type {ChatProps, PersonId} from '../types';
import {entranceStyle} from './animation';
import {Bubble, type TickState} from './Bubble';
import {Avatar} from './Header';
import {TypingIndicator} from './TypingIndicator';

type Measured = {
  viewportHeight: number;
  typingHeight: number;
  rows: {top: number; height: number}[];
};

/**
 * Lays out every message once (at full size, hidden until it appears), measures
 * the rows, then scrolls the column so the newest bubble or typing indicator
 * stays just above the bottom edge.
 */
export const ChatArea: React.FC<{
  chat: ChatProps;
  theme: Theme;
  timeline: Timeline;
  width: number;
  top: number;
}> = ({chat, theme, timeline, width, top}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {layout, bubble, animation, meta, avatars, typing} = theme;
  const messages = chat.messages;

  const viewportRef = useRef<HTMLDivElement>(null);
  const typingProbeRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [measured, setMeasured] = useState<Measured | null>(null);
  const [handle] = useState(() => delayRender('Measuring chat layout'));

  useLayoutEffect(() => {
    setMeasured({
      viewportHeight: viewportRef.current!.clientHeight,
      typingHeight: typingProbeRef.current!.offsetHeight,
      rows: rowRefs.current.slice(0, messages.length).map((el) => ({top: el!.offsetTop, height: el!.offsetHeight})),
    });
    continueRender(handle);
  }, [handle, messages.length]);

  // --- Scroll: each typing-start / appear event springs the column to a new offset.
  let scroll = 0;
  if (measured) {
    const visibleBottom = measured.viewportHeight - layout.paddingTop - layout.paddingBottom;
    // "bottom": the newest item always sits on the bottom edge and pushes older ones up
    // (offset may be negative, which moves the column down). "top": fill from the top first.
    const offsetFor = (contentBottom: number) =>
      layout.anchor === 'top' ? Math.max(0, contentBottom - visibleBottom) : contentBottom - visibleBottom;
    const events: {frame: number; offset: number}[] = [];
    timeline.items.forEach((item, i) => {
      const row = measured.rows[i];
      if (item.showTyping) events.push({frame: item.typingStart, offset: offsetFor(row.top + measured.typingHeight)});
      events.push({frame: item.appear, offset: offsetFor(row.top + row.height)});
    });
    // Start already positioned for the first item so it appears in place instead of sliding in.
    let previous = layout.anchor === 'top' ? 0 : events[0]?.offset ?? 0;
    scroll = previous;
    for (const event of events) {
      if (frame < event.frame) break;
      const progress = spring({
        frame: frame - event.frame,
        fps,
        config: {damping: animation.scrollDamping},
        durationInFrames: Math.round(animation.scrollDuration * fps),
      });
      scroll += (event.offset - previous) * progress;
      previous = event.offset;
    }
  }

  const contentWidth = width - layout.paddingX * 2;
  const maxWidth = contentWidth * layout.bubbleMaxWidth;
  const appeared = (i: number) => i >= 0 && i < messages.length && frame >= timeline.items[i].appear;
  const sameSender = (a: number, b: number) =>
    a >= 0 && b >= 0 && a < messages.length && b < messages.length && messages[a].from === messages[b].from;
  const outer = (side: PersonId) => (side === 'A' ? 'right' : 'left');
  const align = (side: PersonId) => (side === 'A' ? 'flex-end' : 'flex-start');

  const avatarFor = (side: PersonId, below: boolean) =>
    avatars.show && (
      <div style={below ? {marginTop: avatars.offsetY, [`margin${side === 'A' ? 'Right' : 'Left'}`]: avatars.offsetX} : {}}>
        <Avatar person={chat.people[side]} size={avatars.size} look={avatars} />
      </div>
    );

  /** Typing indicator plus (optionally) the typer's avatar: beside it for bare dots, below it for a bubble. */
  const typingSlot = (side: PersonId, local: number, groupedPrev: boolean, style?: React.CSSProperties) => {
    const indicator = (
      <TypingIndicator
        theme={theme}
        side={side}
        frame={local}
        fps={fps}
        showTail={bubble.tail === 'speech' || bubble.tailPosition === 'last' || !groupedPrev}
        groupedPrev={groupedPrev}
      />
    );
    const beside = !typing.bubble;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: beside ? (side === 'A' ? 'row-reverse' : 'row') : 'column',
          alignItems: beside ? 'center' : align(side),
          gap: beside ? 16 : 0,
          transformOrigin: `bottom ${outer(side)}`,
          ...style,
        }}
      >
        {beside && avatarFor(side, false)}
        {indicator}
        {!beside && avatarFor(side, true)}
      </div>
    );
  };

  return (
    <div
      ref={viewportRef}
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        // Soft fade where messages scroll out under the header.
        maskImage: layout.fadeTop ? `linear-gradient(to bottom, transparent 0, black ${layout.fadeTop}px)` : undefined,
      }}
    >
      <div
        style={{
          position: 'relative',
          margin: `${layout.paddingTop}px ${layout.paddingX}px 0`,
          transform: `translateY(${-scroll}px)`,
        }}
      >
        {messages.map((message, i) => {
          const item = timeline.items[i];
          const side = message.from;
          const groupedPrev = sameSender(i, i - 1);
          // Only counts as grouped with the next bubble once that bubble is on screen.
          const nextVisible = appeared(i + 1) || (i + 1 < messages.length && timeline.items[i + 1].showTyping && frame >= timeline.items[i + 1].typingStart);
          const groupedNext = sameSender(i, i + 1) && nextVisible;
          const showTail =
            bubble.tail === 'speech' ? true : bubble.tailPosition === 'first' ? !groupedPrev : !groupedNext;
          const typingVisible = item.showTyping && frame >= item.typingStart && frame < item.appear;

          let ticks: TickState | null = null;
          if (meta.readTicks && side === 'A') {
            ticks = frame >= item.readAt ? 'read' : frame >= item.appear + fps * 0.3 ? 'delivered' : 'sent';
          }

          return (
            <div
              key={i}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: side === 'A' ? 'flex-end' : 'flex-start',
                marginTop: i === 0 ? 0 : groupedPrev ? layout.groupGap : layout.messageGap,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: align(side),
                  transformOrigin: `${bubble.tailPosition === 'first' && bubble.tail !== 'speech' ? 'top' : 'bottom'} ${outer(side)}`,
                  ...entranceStyle(animation.entrance, frame - item.appear, fps, side),
                }}
              >
                <Bubble
                  text={message.text}
                  side={side}
                  theme={theme}
                  maxWidth={maxWidth}
                  showTail={showTail}
                  groupedPrev={groupedPrev}
                  groupedNext={groupedNext}
                  time={meta.timestamps ? messageTime(message, i, theme) : null}
                  ticks={ticks}
                  seed={i}
                />
                {avatarFor(side, true)}
              </div>
              {typingVisible && (
                <div style={{position: 'absolute', top: 0, display: 'flex', [outer(side)]: 0}}>
                  {typingSlot(side, frame - item.typingStart, groupedPrev, entranceStyle('pop', frame - item.typingStart, fps, side))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Invisible probe used to measure the typing indicator's height. */}
      <div ref={typingProbeRef} style={{position: 'absolute', visibility: 'hidden', top: 0, left: 0}}>
        {typingSlot('B', 0, false)}
      </div>
    </div>
  );
};
