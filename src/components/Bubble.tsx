import React from 'react';
import type {BubbleColors, Theme} from '../theme';
import type {PersonId} from '../types';
import {TAIL_CORNER_RADIUS, Tail, speechTailDepth} from './Tail';
import {wobbleFilter} from './Wobble';

export type TickState = 'sent' | 'delivered' | 'read';

const segmenter = new Intl.Segmenter(undefined, {granularity: 'grapheme'});
const EMOJI_ONLY = /^[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}‍️⃣\s]+$/u;

export const isEmojiOnly = (text: string) => {
  const trimmed = text.trim();
  if (!EMOJI_ONLY.test(trimmed)) return false;
  const count = Array.from(segmenter.segment(trimmed)).filter((s) => s.segment.trim()).length;
  return count > 0 && count <= 3;
};

export const bubbleFilter = (theme: Theme, colors: BubbleColors) =>
  [
    theme.bubble.shadow && `drop-shadow(${theme.bubble.shadow})`,
    colors.glow && `drop-shadow(0 0 ${colors.glowSize}px ${colors.glow})`,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

/** border-radius string for a bubble given grouping and tail placement. */
export const bubbleRadius = (
  theme: Theme,
  side: PersonId,
  opts: {groupedPrev: boolean; groupedNext: boolean; showTail: boolean},
) => {
  const {radius, groupRadius, tail, tailPosition} = theme.bubble;
  let top = opts.groupedPrev ? groupRadius : radius;
  let bottom = opts.groupedNext ? groupRadius : radius;
  if (opts.showTail && (tail === 'curved' || tail === 'triangle')) {
    if (tailPosition === 'first') top = TAIL_CORNER_RADIUS.first;
    else bottom = TAIL_CORNER_RADIUS.last;
  }
  // Order: top-left, top-right, bottom-right, bottom-left. The "outer" side is right for A.
  return side === 'A'
    ? `${radius}px ${top}px ${bottom}px ${radius}px`
    : `${top}px ${radius}px ${radius}px ${bottom}px`;
};

/** Extra space a bubble reserves below itself for its tail. */
export const tailSpace = (theme: Theme, showTail: boolean) =>
  showTail && theme.bubble.tail === 'speech' ? speechTailDepth(theme.bubble.tailSize) : 0;

/**
 * The bubble's background + tail on their own layer behind the content, so the
 * hand-drawn wobble filter distorts the outline but never the text.
 */
export const BubbleShape: React.FC<{
  theme: Theme;
  side: PersonId;
  background: string;
  tailBackground: string;
  border: string | null;
  radius: string;
  showTail: boolean;
  seed: number;
}> = ({theme, side, background, tailBackground, border, radius, showTail, seed}) => {
  const b = theme.bubble;
  return (
    <div style={{position: 'absolute', inset: 0, filter: wobbleFilter(b.wobble, seed)}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background,
          border: border ?? undefined,
          borderRadius: radius,
          backdropFilter: b.backdropBlur ? `blur(${b.backdropBlur}px)` : undefined,
        }}
      />
      {showTail && (
        <Tail
          side={side}
          style={b.tail}
          position={b.tailPosition}
          size={b.tailSize}
          inset={b.tailInset}
          background={tailBackground}
        />
      )}
    </div>
  );
};

const Ticks: React.FC<{state: TickState; size: number; color: string; readColor: string}> = ({
  state,
  size,
  color,
  readColor,
}) => {
  const stroke = state === 'read' ? readColor : color;
  return (
    <svg width={size * 1.25} height={size * 0.8} viewBox="0 0 20 13" style={{marginLeft: size * 0.25}}>
      <path d="M1 7 L5 11 L13 2" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      {state !== 'sent' && (
        <path d="M8 10 L9 11 L17 2" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
};

const Meta: React.FC<{theme: Theme; colors: BubbleColors; time: string | null; ticks: TickState | null}> = ({
  theme,
  colors,
  time,
  ticks,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: theme.meta.fontSize,
      lineHeight: 1,
      color: colors.metaColor,
      whiteSpace: 'nowrap',
      fontWeight: 400,
    }}
  >
    {time}
    {ticks && (
      <Ticks state={ticks} size={theme.meta.fontSize} color={theme.meta.tickColor} readColor={theme.meta.readTickColor} />
    )}
  </span>
);

export type BubbleProps = {
  text: string;
  side: PersonId;
  theme: Theme;
  maxWidth: number;
  showTail: boolean;
  groupedPrev: boolean;
  groupedNext: boolean;
  time: string | null;
  ticks: TickState | null;
  /** Picks the wobble variant so neighbouring bubbles aren't identical. */
  seed?: number;
  style?: React.CSSProperties;
};

export const Bubble: React.FC<BubbleProps> = ({
  text,
  side,
  theme,
  maxWidth,
  showTail,
  groupedPrev,
  groupedNext,
  time,
  ticks,
  seed = 0,
  style,
}) => {
  const b = theme.bubble;
  const colors = b[side];
  const hasMeta = Boolean(time || ticks);
  const origin = `${b.tailPosition === 'first' ? 'top' : 'bottom'} ${side === 'A' ? 'right' : 'left'}`;

  if (b.emojiOnlyLarge && isEmojiOnly(text)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: side === 'A' ? 'flex-end' : 'flex-start',
          transformOrigin: origin,
          ...style,
        }}
      >
        <div style={{fontSize: b.fontSize * b.emojiOnlyScale, lineHeight: 1.15}}>{text}</div>
        {hasMeta && <Meta theme={theme} colors={colors} time={time} ticks={ticks} />}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        maxWidth,
        minWidth: Math.min(b.minWidth, maxWidth),
        marginBottom: tailSpace(theme, showTail),
        filter: bubbleFilter(theme, colors),
        transformOrigin: origin,
        ...style,
        opacity: Number(style?.opacity ?? 1) * colors.opacity,
      }}
    >
      <BubbleShape
        theme={theme}
        side={side}
        background={colors.background}
        tailBackground={colors.tailColor ?? colors.background}
        border={colors.border}
        radius={bubbleRadius(theme, side, {groupedPrev, groupedNext, showTail})}
        showTail={showTail}
        seed={seed}
      />
      <div
        style={{
          position: 'relative',
          color: colors.textColor,
          padding: `${b.paddingY}px ${b.paddingX}px`,
          fontSize: b.fontSize,
          fontWeight: b.fontWeight,
          lineHeight: b.lineHeight,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
        }}
      >
        {text}
        {hasMeta && (
          <>
            {/* Invisible copy reserves room so the timestamp never overlaps the text. */}
            <span style={{visibility: 'hidden', marginLeft: b.paddingX * 0.5}}>
              <Meta theme={theme} colors={colors} time={time} ticks={ticks} />
            </span>
            <span style={{position: 'absolute', right: b.paddingX * 0.6, bottom: b.paddingY * 0.55}}>
              <Meta theme={theme} colors={colors} time={time} ticks={ticks} />
            </span>
          </>
        )}
      </div>
    </div>
  );
};
