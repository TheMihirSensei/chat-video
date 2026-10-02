import React, {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {
  AbsoluteFill,
  Html5Audio,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {resolveSrc} from '../assets';
import {Background} from '../components/Background';
import {WobbleFilters} from '../components/Wobble';
import {useGoogleFonts} from '../fonts';
import type {Theme} from '../theme';
import {resolveLessonTheme, type LessonTheme} from './theme';
import {computeLessonTimeline, type LessonTimeline, type LessonTimelineItem} from './timing';
import type {CharacterDef, LessonLine, LessonProps} from './types';

const segmenter = new Intl.Segmenter(undefined, {granularity: 'grapheme'});
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const fontFamily = (family: string, emoji: string | null) =>
  [`"${family}"`, emoji && `"${emoji}"`, 'sans-serif'].filter(Boolean).join(', ');

const Title: React.FC<{theme: LessonTheme; title: string; subtitle?: string}> = ({theme, title, subtitle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = theme.title;
  const s = spring({frame, fps, config: {damping: 200}, durationInFrames: Math.round(fps * 0.6)});
  return (
    <div
      style={{
        position: 'absolute',
        top: t.top,
        left: theme.layout.paddingX,
        right: theme.layout.paddingX,
        transform: `translateY(calc(-50% + ${(1 - s) * -30}px))`,
        opacity: s,
        textAlign: t.align,
        zIndex: 5,
      }}
    >
      <div
        style={{
          fontFamily: fontFamily(theme.fonts.title.family, theme.fonts.emoji),
          fontSize: t.size,
          fontWeight: t.weight,
          color: t.color,
          lineHeight: 1.15,
          WebkitTextStroke: t.stroke ? `${t.strokeWidth}px ${t.stroke}` : undefined,
          paintOrder: 'stroke fill',
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontFamily: fontFamily(theme.fonts.translation.family, theme.fonts.emoji),
            fontSize: t.subtitleSize,
            color: t.subtitleColor,
            marginTop: 8,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

const characterStyle = (theme: LessonTheme, local: number, fps: number, side: 'left' | 'right'): React.CSSProperties => {
  if (local < 0) return {opacity: 0};
  const c = theme.character;
  const out = side === 'right' ? 1 : -1;
  switch (c.entrance) {
    case 'slide': {
      const s = spring({frame: local, fps, config: {damping: 16, stiffness: 120}});
      return {transform: `translateX(${(1 - s) * 400 * out}px)`, opacity: interpolate(local, [0, 6], [0, 1], clamp)};
    }
    case 'drop': {
      const s = spring({frame: local, fps, config: {damping: 9, stiffness: 140}});
      return {transform: `translateY(${(1 - s) * -500}px)`, opacity: interpolate(local, [0, 4], [0, 1], clamp)};
    }
    case 'fade':
      return {opacity: interpolate(local, [0, 12], [0, 1], clamp)};
    case 'pop':
    default: {
      const s = spring({frame: local, fps, config: {damping: 10, stiffness: 170, mass: 0.7}});
      return {transform: `scale(${s})`, opacity: interpolate(local, [0, 3], [0, 1], clamp)};
    }
  }
};

const Character: React.FC<{
  theme: LessonTheme;
  def: CharacterDef;
  side: 'left' | 'right';
  item: LessonTimelineItem;
  index: number;
}> = ({theme, def, side, item, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = theme.character;
  const local = frame - item.characterIn;
  const height = def.height ?? c.height;
  const offsetX = def.offsetX ?? c.offsetX;
  const offsetY = def.offsetY ?? c.offsetY;

  // Idle float (phase-shifted per line so characters don't bob in sync) and talking bounce.
  const seconds = frame / fps;
  const bob = c.idle === 'bob' && local > fps * 0.5 ? Math.sin(seconds * 2.2 + index * 1.7) * c.idleAmplitude : 0;
  const talking = item.audioPlays.some((start) => frame >= start && frame < start + item.audioFrames);
  const talk = c.talk === 'bounce' && talking ? Math.abs(Math.sin(seconds * Math.PI * 4)) * 0.045 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        [side]: theme.layout.characterInset - offsetX,
        height,
        transform: `translate(${side === 'right' ? '50%' : '-50%'}, calc(-50% + ${offsetY}px))`,
        zIndex: 3,
      }}
    >
      <div style={{height: '100%', transformOrigin: 'bottom center', ...characterStyle(theme, local, fps, side)}}>
        <Img
          src={resolveSrc(def.image)}
          style={{
            height: '100%',
            display: 'block',
            transformOrigin: 'bottom center',
            transform: `translateY(${bob}px) scale(${1 + talk * 0.5}, ${1 - talk}) ${def.flip ? 'scaleX(-1)' : ''}`,
          }}
        />
      </div>
    </div>
  );
};

const cardEntrance = (theme: LessonTheme, local: number, fps: number, side: 'left' | 'right'): React.CSSProperties => {
  if (local < 0) return {opacity: 0};
  const origin = side === 'right' ? 'right center' : 'left center';
  switch (theme.card.entrance) {
    case 'pop': {
      const s = spring({frame: local, fps, config: {damping: 13, stiffness: 200, mass: 0.6}});
      return {transform: `scale(${interpolate(s, [0, 1], [0.6, 1])})`, transformOrigin: origin, opacity: interpolate(local, [0, 4], [0, 1], clamp)};
    }
    case 'slide': {
      const s = spring({frame: local, fps, config: {damping: 200}});
      return {transform: `translateX(${(1 - s) * (side === 'right' ? 200 : -200)}px)`, opacity: s};
    }
    case 'fade':
      return {opacity: interpolate(local, [0, 10], [0, 1], clamp)};
    case 'grow':
    default: {
      // Unrolls out of the character.
      const s = spring({frame: local, fps, config: {damping: 18, stiffness: 160}});
      return {transform: `scaleX(${s})`, transformOrigin: origin, opacity: interpolate(local, [0, 3], [0, 1], clamp)};
    }
  }
};

const Card: React.FC<{
  theme: LessonTheme;
  line: LessonLine;
  side: 'left' | 'right';
  item: LessonTimelineItem | null;
}> = ({theme, line, side, item}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = theme.card;
  const align = c.align === 'auto' ? (side === 'right' ? 'left' : 'right') : c.align;

  // item === null renders the card fully visible (used for layout measurement).
  const textLocal = item ? frame - item.textIn : Infinity;
  let text = line.text;
  let textOpacity = 1;
  if (c.textReveal === 'typewriter') {
    const chars = Array.from(segmenter.segment(line.text)).map((s) => s.segment);
    const shown = Math.max(0, Math.floor(textLocal / (c.typewriterSpeed * fps)) + 1);
    text = chars.slice(0, shown).join('');
  } else if (c.textReveal === 'fade') {
    textOpacity = interpolate(textLocal, [0, 8], [0, 1], clamp);
  } else if (textLocal < 0) {
    textOpacity = 0;
  }
  // Translation and reading follow slightly after the main text.
  const subOpacity = c.textReveal === 'none' ? (textLocal >= 0 ? 1 : 0) : interpolate(textLocal, [6, 14], [0, 1], clamp);

  const sidePad = (s: 'left' | 'right') => (s === side ? c.characterSidePadding : c.paddingX);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: c.minHeight,
        boxSizing: 'border-box',
        padding: `${c.paddingY}px ${sidePad('right')}px ${c.paddingY}px ${sidePad('left')}px`,
        background: c.background,
        border: c.border ?? undefined,
        borderRadius: c.radius,
        boxShadow: c.shadow ? `${c.shadow.x}px ${c.shadow.y}px 0 ${c.shadow.color}` : undefined,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: align,
        ...(item ? cardEntrance(theme, frame - item.cardIn, fps, side) : {}),
      }}
    >
      <div
        style={{
          fontFamily: fontFamily(theme.fonts.text.family, theme.fonts.emoji),
          fontSize: c.textSize,
          fontWeight: c.textWeight,
          color: c.textColor,
          lineHeight: 1.25,
          opacity: textOpacity,
          // Reserve the full text's space so the typewriter doesn't reflow the card.
          display: 'grid',
        }}
      >
        <span style={{gridArea: '1 / 1', visibility: 'hidden'}}>{line.text}</span>
        <span style={{gridArea: '1 / 1'}}>{text}</span>
      </div>
      {line.reading && (
        <div
          style={{
            fontFamily: fontFamily(theme.fonts.reading.family, theme.fonts.emoji),
            fontSize: c.readingSize,
            color: c.readingColor,
            lineHeight: 1.3,
            opacity: subOpacity,
          }}
        >
          {line.reading}
        </div>
      )}
      {line.translation && (
        <div
          style={{
            fontFamily: fontFamily(theme.fonts.translation.family, theme.fonts.emoji),
            fontSize: c.translationSize,
            color: c.translationColor,
            lineHeight: 1.3,
            marginTop: 4,
            opacity: subOpacity,
          }}
        >
          {c.translationFormat.replace('{t}', line.translation)}
        </div>
      )}
    </div>
  );
};

type Rows = {top: number; height: number}[];

const LessonStage: React.FC<{
  theme: LessonTheme;
  lessonProps: LessonProps;
  characters: Record<string, CharacterDef>;
  timeline: LessonTimeline;
}> = ({theme, lessonProps, characters, timeline}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const {layout, placeholder} = theme;
  const title = theme.title.show && lessonProps.title ? (
    <Title theme={theme} title={lessonProps.title} subtitle={lessonProps.subtitle} />
  ) : null;
  const lines = lessonProps.lines;

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [rows, setRows] = useState<Rows | null>(null);
  const [handle] = useState(() => delayRender('Measuring lesson layout'));
  useLayoutEffect(() => {
    setRows(rowRefs.current.slice(0, lines.length).map((el) => ({top: el!.offsetTop, height: el!.offsetHeight})));
    continueRender(handle);
  }, [handle, lines.length]);

  const sideOf = (line: LessonLine) => {
    const def = characters[line.character];
    if (!def) throw new Error(`Line uses unknown character "${line.character}". Known: ${Object.keys(characters).join(', ')}`);
    return def.side ?? 'right';
  };

  // Scroll up whenever a new line starts and its card (plus a peek of the next) would overflow.
  let scroll = 0;
  if (rows) {
    // Row tops already include layout.top (it's padding on the scrolling column).
    const visibleBottom = height - layout.bottom;
    let previous = 0;
    timeline.items.forEach((item, i) => {
      const hasNext = i + 1 < lines.length;
      const target = Math.max(0, rows[i].top + rows[i].height + (hasNext && placeholder.show ? layout.peek : 0) - visibleBottom);
      if (frame < item.characterIn) return;
      const progress = spring({frame: frame - item.characterIn, fps, config: {damping: 200}, durationInFrames: Math.round(fps * 0.6)});
      scroll += (target - previous) * progress;
      previous = target;
    });
  }

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        // Fixed title: fade cards out just above where the first card starts.
        maskImage: !theme.title.scroll && title ? `linear-gradient(to bottom, transparent ${layout.top - 50}px, black ${layout.top - 10}px)` : undefined,
      }}
    >
      {!theme.title.scroll && title}
      <div
        style={{
          position: 'relative',
          padding: `${layout.top}px ${layout.paddingX}px 0`,
          transform: `translateY(${-scroll}px)`,
        }}
      >
        {theme.title.scroll && title}
        {lines.map((line, i) => {
          const item = timeline.items[i];
          const side = sideOf(line);
          const prev = timeline.items[i - 1];
          // Placeholder: the empty card where this line will appear, shown once the previous card is up.
          const showPlaceholder = placeholder.show && prev && frame >= prev.cardIn && frame < item.cardIn;
          const placeholderOpacity = prev ? interpolate(frame - prev.cardIn, [6, 16], [0, 1], clamp) : 0;
          return (
            <div
              key={i}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              style={{
                position: 'relative',
                marginTop: i === 0 ? 0 : layout.cardGap,
                [side === 'right' ? 'marginRight' : 'marginLeft']: layout.characterInset,
              }}
            >
              {showPlaceholder && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: placeholder.background,
                    borderRadius: placeholder.radius,
                    opacity: placeholderOpacity,
                  }}
                />
              )}
              <Card theme={theme} line={line} side={side} item={rows ? item : null} />
            </div>
          );
        })}
        {/* Characters are positioned per row but drawn above every card. */}
        {rows &&
          lines.map((line, i) => {
            const side = sideOf(line);
            return (
              <div
                key={`c${i}`}
                style={{position: 'absolute', top: rows[i].top, height: rows[i].height, left: 0, right: 0}}
              >
                <div style={{position: 'absolute', inset: `0 ${layout.paddingX}px`}}>
                  <Character theme={theme} def={characters[line.character]} side={side} item={timeline.items[i]} index={i} />
                </div>
              </div>
            );
          })}
      </div>
    </AbsoluteFill>
  );
};

const LessonAudio: React.FC<{theme: LessonTheme; lines: LessonLine[]; timeline: LessonTimeline}> = ({
  theme,
  lines,
  timeline,
}) => {
  const {fps} = useVideoConfig();
  const {sounds, music} = theme;
  return (
    <>
      {music.src && <Html5Audio src={resolveSrc(music.src)} volume={music.volume} loop />}
      {timeline.items.map((item, i) => (
        <React.Fragment key={i}>
          {sounds.characterIn && (
            <Sequence from={item.characterIn} durationInFrames={fps * 2} layout="none">
              <Html5Audio src={resolveSrc(sounds.characterIn)} volume={sounds.volume} />
            </Sequence>
          )}
          {sounds.cardIn && (
            <Sequence from={item.cardIn} durationInFrames={fps * 2} layout="none">
              <Html5Audio src={resolveSrc(sounds.cardIn)} volume={sounds.volume} />
            </Sequence>
          )}
          {lines[i].audio &&
            item.audioPlays.map((start, k) => (
              <Sequence key={k} from={start} durationInFrames={item.audioFrames} layout="none">
                <Html5Audio src={resolveSrc(lines[i].audio!)} volume={sounds.voiceVolume} />
              </Sequence>
            ))}
        </React.Fragment>
      ))}
    </>
  );
};

export const LessonVideo: React.FC<LessonProps> = (props) => {
  const {fps} = useVideoConfig();
  const theme = useMemo(() => resolveLessonTheme(props.theme), [props.theme]);
  const background = useMemo(
    () => ({...theme.background, ...(props.background ?? {})}) as Theme['background'],
    [theme, props.background],
  );
  const characters = useMemo(() => ({...theme.characters, ...(props.characters ?? {})}), [theme, props.characters]);
  const timeline = useMemo(
    () => computeLessonTimeline(props.lines, props.audioDurations, theme, fps),
    [props.lines, props.audioDurations, theme, fps],
  );
  const sample = [
    props.title ?? '',
    props.subtitle ?? '',
    ...props.lines.flatMap((l) => [l.text, l.reading ?? '', l.translation ?? '']),
    theme.card.translationFormat,
  ].join(' ');
  const f = theme.fonts;
  const fontsReady = useGoogleFonts(
    [f.text, f.translation, f.reading, f.title, ...(f.emoji ? [{family: f.emoji, weights: []}] : [])],
    sample,
  );

  return (
    <AbsoluteFill style={{fontFamily: fontFamily(f.text.family, f.emoji)}}>
      {/* Wobble filters are shared with the chat themes (used if background.panel.wobble is set). */}
      <WobbleFilters theme={{bubble: {wobble: 0}, background} as unknown as Theme} />
      <Background background={background} />
      {fontsReady && (
        <>
          <LessonStage theme={theme} lessonProps={props} characters={characters} timeline={timeline} />
        </>
      )}
      <LessonAudio theme={theme} lines={props.lines} timeline={timeline} />
    </AbsoluteFill>
  );
};
