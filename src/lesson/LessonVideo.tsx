import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Html5Audio,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {resolveSrc} from '../assets';
import {Background} from '../components/Background';
import {MediaFile} from '../components/MediaFile';
import {WobbleFilters} from '../components/Wobble';
import {useGoogleFonts} from '../fonts';
import type {Theme} from '../theme';
import {resolveLessonTheme, type LessonTheme} from './theme';
import {
  computeLessonTimeline,
  getLessonSlides,
  type LessonSlideTiming,
  type LessonTimeline,
  type LessonTimelineItem,
} from './timing';
import type {CharacterDef, LessonLine, LessonProps, LessonSlide} from './types';

const segmenter = new Intl.Segmenter(undefined, {granularity: 'grapheme'});
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const fontFamily = (family: string, emoji: string | null) =>
  [`"${family}"`, emoji && `"${emoji}"`, 'sans-serif'].filter(Boolean).join(', ');

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
    case 'none':
      return {};
    case 'pop':
    default: {
      const s = spring({frame: local, fps, config: {damping: 10, stiffness: 170, mass: 0.7}});
      return {transform: `scale(${s})`, opacity: interpolate(local, [0, 3], [0, 1], clamp)};
    }
  }
};

/** A line's picture (usually an animated GIF) standing at the card's edge. */
const Character: React.FC<{
  theme: LessonTheme;
  def: CharacterDef & {image: string};
  side: 'left' | 'right';
  item: LessonTimelineItem;
}> = ({theme, def, side, item}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = theme.character;
  const local = frame - item.characterIn;
  const height = def.height ?? c.height;
  const offsetX = def.offsetX ?? c.offsetX;
  const offsetY = def.offsetY ?? c.offsetY;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        [side]: theme.layout.characterInset - offsetX,
        height,
        // Square box sized by height; the picture is fitted inside it.
        width: height,
        transform: `translate(${side === 'right' ? '50%' : '-50%'}, calc(-50% + ${offsetY}px))`,
        zIndex: 3,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: 'bottom center',
          ...characterStyle(theme, local, fps, side),
        }}
      >
        {/* The GIF starts playing from its first frame when the picture appears. */}
        <Sequence from={item.characterIn} layout="none">
          <MediaFile
            src={def.image}
            fit={c.fit}
            speed={c.speed}
            style={def.flip ? {transform: 'scaleX(-1)'} : undefined}
          />
        </Sequence>
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
  // The translation follows slightly after the main text.
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

/** Style for card/row `index` as the slide leaves; cards go one after another (stagger). */
const exitStyle = (theme: LessonTheme, local: number, fps: number, index: number): React.CSSProperties => {
  const tr = theme.transition;
  const p = interpolate(local - index * tr.stagger * fps, [0, tr.duration * fps], [0, 1], clamp);
  if (p <= 0) return {};
  const e = p * p * (3 - 2 * p); // smoothstep
  switch (tr.out) {
    case 'rise':
      return {opacity: 1 - e, transform: `translateY(${-e * 60}px)`};
    case 'sink':
      return {opacity: 1 - e, transform: `translateY(${e * 60}px)`};
    case 'slideLeft':
      return {opacity: 1 - e, transform: `translateX(${-e * 260}px)`};
    case 'shrink':
      return {opacity: 1 - e, transform: `scale(${1 - e * 0.25})`};
    case 'fade':
    default:
      return {opacity: 1 - e};
  }
};

/** One self-contained slide (e.g. question + answer), centered on screen. */
const SlideStage: React.FC<{
  theme: LessonTheme;
  slide: LessonSlide;
  timing: LessonSlideTiming;
  characters: Record<string, CharacterDef>;
}> = ({theme, slide, timing, characters}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {layout} = theme;
  if (frame < timing.start || frame > timing.end) return null;

  // A line's picture = its character preset (if any) with the line's own fields on top.
  const pictureOf = (line: LessonLine) => {
    const preset = line.character ? characters[line.character] : {};
    if (!preset) {
      throw new Error(`Line uses unknown character "${line.character}". Known: ${Object.keys(characters).join(', ')}`);
    }
    const def: CharacterDef = {...preset};
    for (const key of ['image', 'side', 'height', 'offsetX', 'offsetY', 'flip'] as const) {
      if (line[key] !== undefined) (def as Record<string, unknown>)[key] = line[key];
    }
    if (!def.image) throw new Error(`Line "${line.text}" has no "image" (set it on the line or its character).`);
    return {...def, image: def.image, side: def.side ?? 'right'};
  };
  const outLocal = timing.outStart === null ? -1 : frame - timing.outStart;

  return (
    <div
      style={{
        position: 'absolute',
        top: layout.top,
        bottom: layout.bottom,
        left: layout.paddingX,
        right: layout.paddingX,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {slide.lines.map((line, i) => {
        const item = timing.lines[i];
        const picture = pictureOf(line);
        const side = picture.side;
        return (
          <div
            key={i}
            style={{
              position: 'relative',
              marginTop: i === 0 ? 0 : layout.cardGap,
              [side === 'right' ? 'marginRight' : 'marginLeft']: layout.characterInset,
              ...(outLocal >= 0 ? exitStyle(theme, outLocal, fps, i) : {}),
            }}
          >
            <Card theme={theme} line={line} side={side} item={item} />
            {/* Spans from the column edge, so the character sits at characterInset like before. */}
            <div style={{position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, [side]: -layout.characterInset}}>
              <Character theme={theme} def={picture} side={side} item={item} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LessonAudio: React.FC<{theme: LessonTheme; timeline: LessonTimeline}> = ({theme, timeline}) => {
  const {fps} = useVideoConfig();
  const {sounds, music} = theme;
  const items = timeline.slides.flatMap((s) => s.lines);
  return (
    <>
      {music.src && <Html5Audio src={resolveSrc(music.src)} volume={music.volume} loop />}
      {items.map((item, i) => (
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
          {item.plays.map((play, k) => (
            <Sequence key={k} from={play.start} durationInFrames={play.frames} layout="none">
              <Html5Audio src={resolveSrc(play.src)} volume={sounds.voiceVolume} />
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
  const slides = useMemo(() => getLessonSlides(props, theme), [props, theme]);
  const timeline = useMemo(
    () => computeLessonTimeline(slides, props.audioDurations, props.translationAudioDurations, theme, fps),
    [slides, props.audioDurations, props.translationAudioDurations, theme, fps],
  );
  const sample = [
    ...slides.flatMap((s) => s.lines.flatMap((l) => [l.text, l.translation ?? ''])),
    theme.card.translationFormat,
  ].join(' ');
  const f = theme.fonts;
  const fontsReady = useGoogleFonts(
    [f.text, f.translation, ...(f.emoji ? [{family: f.emoji, weights: []}] : [])],
    sample,
  );

  return (
    <AbsoluteFill style={{fontFamily: fontFamily(f.text.family, f.emoji)}}>
      {/* Wobble filters are shared with the chat themes (used if background.panel.wobble is set). */}
      <WobbleFilters theme={{bubble: {wobble: 0}, background} as unknown as Theme} />
      <Background background={background} />
      {fontsReady && (
        <>
          {slides.map((slide, i) => (
            <SlideStage
              key={i}
              theme={theme}
              slide={slide}
              timing={timeline.slides[i]}
              characters={characters}
            />
          ))}
        </>
      )}
      <LessonAudio theme={theme} timeline={timeline} />
    </AbsoluteFill>
  );
};
