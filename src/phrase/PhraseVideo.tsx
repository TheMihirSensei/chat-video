import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {resolveSrc} from '../assets';
import {Background} from '../components/Background';
import {MediaFile} from '../components/MediaFile';
import {WobbleFilters} from '../components/Wobble';
import {useGoogleFonts} from '../fonts';
import type {Theme} from '../theme';
import {resolvePhraseTheme, type PhraseTheme, type TextIn, type TextOut, type TextStyle} from './theme';
import {computePhraseTimeline, type PhraseTimeline, type PhraseTimelineItem} from './timing';
import type {PhraseProps, PhraseSlide} from './types';

const segmenter = new Intl.Segmenter(undefined, {granularity: 'grapheme'});
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.out(Easing.cubic);

const progress = (local: number, frames: number) =>
  frames <= 0 ? (local >= 0 ? 1 : 0) : interpolate(local, [0, frames], [0, 1], {...clamp, easing: ease});

/** Whole-block entrance (also used for the translation). */
const blockIn = (kind: TextIn, local: number, frames: number): React.CSSProperties => {
  const p = progress(local, frames);
  switch (kind) {
    case 'none':
      return {opacity: local >= 0 ? 1 : 0};
    case 'rise':
    case 'chars':
    case 'typewriter':
      return {opacity: p, transform: `translateY(${(1 - p) * 28}px)`};
    case 'blur':
      return {opacity: p, filter: `blur(${(1 - p) * 14}px)`, transform: `scale(${1.04 - 0.04 * p})`};
    case 'zoom':
      return {opacity: p, transform: `scale(${0.88 + 0.12 * p})`};
    case 'fade':
    default:
      return {opacity: p};
  }
};

const blockOut = (kind: TextOut, local: number, frames: number): React.CSSProperties => {
  if (local < 0) return {};
  const p = progress(local, frames);
  switch (kind) {
    case 'none':
      return {opacity: 1};
    case 'rise':
      return {opacity: 1 - p, transform: `translateY(${-p * 30}px)`};
    case 'sink':
      return {opacity: 1 - p, transform: `translateY(${p * 30}px)`};
    case 'blur':
      return {opacity: 1 - p, filter: `blur(${p * 14}px)`};
    case 'fade':
    default:
      return {opacity: 1 - p};
  }
};

const fontCss = (style: TextStyle, emoji: string | null): React.CSSProperties => ({
  fontFamily: [`"${style.font}"`, emoji && `"${emoji}"`, 'sans-serif'].filter(Boolean).join(', '),
  fontSize: style.size,
  fontWeight: style.weight,
  color: style.color,
  lineHeight: style.lineHeight,
  letterSpacing: style.letterSpacing,
  marginTop: style.marginTop,
  WebkitTextStroke: style.stroke ? `${style.strokeWidth}px ${style.stroke}` : undefined,
  paintOrder: 'stroke fill',
  whiteSpace: 'pre-wrap',
});

/** Main text with per-character entrance for `chars` / `typewriter`. */
const MainText: React.FC<{theme: PhraseTheme; text: string; local: number}> = ({theme, text, local}) => {
  const {fps} = useVideoConfig();
  const a = theme.animation;
  const style = fontCss(theme.text.main, theme.emojiFont);

  if (a.textIn !== 'chars' && a.textIn !== 'typewriter') {
    return <div style={{...style, ...blockIn(a.textIn, local, Math.round(a.textInDuration * fps))}}>{text}</div>;
  }

  const stagger = a.charStagger * fps;
  let visibleIndex = 0;
  return (
    <div style={style}>
      {Array.from(segmenter.segment(text)).map(({segment}, i) => {
        if (segment === '\n') return <br key={i} />;
        if (/^\s$/.test(segment)) return <React.Fragment key={i}>{segment}</React.Fragment>;
        const charLocal = local - visibleIndex * stagger;
        visibleIndex++;
        if (a.textIn === 'typewriter') {
          return (
            <span key={i} style={{visibility: charLocal >= 0 ? 'visible' : 'hidden'}}>
              {segment}
            </span>
          );
        }
        const p = progress(charLocal, Math.round(a.textInDuration * fps));
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${(1 - p) * 0.35}em)`,
              filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
            }}
          >
            {segment}
          </span>
        );
      })}
    </div>
  );
};

const SlideText: React.FC<{theme: PhraseTheme; slide: PhraseSlide; item: PhraseTimelineItem; x: number}> = ({
  theme,
  slide,
  item,
  x,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  if (frame < item.start || frame >= item.end + 1) return null;
  const t = theme.text;
  const a = theme.animation;
  const subIn = blockIn(a.translationIn, frame - item.translationIn, Math.round(a.translationInDuration * fps));
  const out = item.outStart === null ? {} : blockOut(a.textOut, frame - item.outStart, Math.round(a.textOutDuration * fps));

  return (
    <div
      style={{
        position: 'absolute',
        left: x * width,
        top: t.y * height,
        width: t.maxWidth,
        transform: 'translate(-50%, -50%)',
        textAlign: t.align,
      }}
    >
      <div style={out}>
        <MainText theme={theme} text={slide.text} local={frame - item.start} />
        {t.showReading && slide.reading && (
          <div style={{...fontCss(t.reading, theme.emojiFont), ...subIn}}>{slide.reading}</div>
        )}
        {t.showTranslation && slide.translation && (
          <div style={{...fontCss(t.translation, theme.emojiFont), ...subIn}}>
            {t.translationFormat.replace('{t}', slide.translation)}
          </div>
        )}
      </div>
    </div>
  );
};

/** Shows the media for each run of slides that share the same file, cross-fading between runs. */
const MediaLayer: React.FC<{theme: PhraseTheme; props: PhraseProps; timeline: PhraseTimeline}> = ({
  theme,
  props,
  timeline,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const m = theme.media;
  if (!m.show) return null;

  const runs: {src: string; from: number; to: number}[] = [];
  props.slides.forEach((slide, i) => {
    const src = slide.media ?? props.media;
    if (!src) return;
    const last = runs[runs.length - 1];
    if (last && last.src === src) return;
    if (last) last.to = timeline.items[i].start;
    runs.push({src, from: runs.length ? timeline.items[i].start : 0, to: durationInFrames});
  });

  const cf = Math.round(m.crossfade * fps);
  const boxW = m.width * width;
  const boxH = m.height * height;
  const top = m.anchor === 'top' ? m.offsetY : m.anchor === 'bottom' ? height - boxH + m.offsetY : (height - boxH) / 2 + m.offsetY;

  return (
    <>
      {runs.map((run, k) => {
        const isFirst = k === 0;
        let style: React.CSSProperties;
        if (isFirst) {
          style = blockIn(m.entrance === 'none' ? 'none' : m.entrance, frame, Math.round(m.entranceDuration * fps));
        } else {
          style = {opacity: interpolate(frame, [run.from - cf, run.from], [0, 1], clamp)};
        }
        const fadeOut = k < runs.length - 1 ? interpolate(frame, [run.to - cf, run.to], [1, 0], clamp) : 1;
        if (frame < run.from - cf || frame > run.to) return null;
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              top,
              [m.side]: m.offsetX,
              width: boxW,
              height: boxH,
              ...style,
              opacity: Number(style.opacity ?? 1) * fadeOut,
            }}
          >
            <Sequence from={Math.max(0, run.from - cf)} layout="none">
              <MediaFile src={run.src} fit={m.fit} speed={m.speed} />
            </Sequence>
          </div>
        );
      })}
    </>
  );
};

const PhraseAudio: React.FC<{theme: PhraseTheme; slides: PhraseSlide[]; timeline: PhraseTimeline}> = ({
  theme,
  slides,
  timeline,
}) => {
  const {fps} = useVideoConfig();
  const {sounds, music} = theme;
  return (
    <>
      {music.src && <Html5Audio src={resolveSrc(music.src)} volume={music.volume} loop />}
      {timeline.items.map((item, i) => (
        <React.Fragment key={i}>
          {sounds.slideIn && (
            <Sequence from={item.start} durationInFrames={fps * 2} layout="none">
              <Html5Audio src={resolveSrc(sounds.slideIn)} volume={sounds.volume} />
            </Sequence>
          )}
          {slides[i].audio &&
            item.audioPlays.map((start, k) => (
              <Sequence key={k} from={start} durationInFrames={item.audioFrames} layout="none">
                <Html5Audio src={resolveSrc(slides[i].audio!)} volume={sounds.voiceVolume} />
              </Sequence>
            ))}
        </React.Fragment>
      ))}
    </>
  );
};

export const PhraseVideo: React.FC<PhraseProps> = (props) => {
  const {fps} = useVideoConfig();
  const theme = useMemo(() => resolvePhraseTheme(props.theme), [props.theme]);
  const background = useMemo(
    () => ({...theme.background, ...(props.background ?? {})}) as Theme['background'],
    [theme, props.background],
  );
  const timeline = useMemo(
    () => computePhraseTimeline(props.slides, props.audioDurations, theme, fps),
    [props.slides, props.audioDurations, theme, fps],
  );
  const t = theme.text;
  const sample = [...props.slides.flatMap((s) => [s.text, s.reading ?? '', s.translation ?? '']), t.translationFormat].join(' ');
  const fontsReady = useGoogleFonts(
    [
      {family: t.main.font, weights: t.main.weights},
      {family: t.reading.font, weights: t.reading.weights},
      {family: t.translation.font, weights: t.translation.weights},
      ...(theme.emojiFont ? [{family: theme.emojiFont, weights: []}] : []),
    ],
    sample,
  );

  // Text centered in the side the media doesn't use, unless the theme pins an x.
  // A pinned x describes the layout with media on the left and is mirrored when it's on the right.
  const m = theme.media;
  const mirrored = m.show && m.side === 'right';
  const x =
    t.x !== null ? (mirrored ? 1 - t.x : t.x) : m.show ? (m.side === 'left' ? (m.width + 1) / 2 : (1 - m.width) / 2) : 0.5;

  return (
    <AbsoluteFill>
      <WobbleFilters theme={{bubble: {wobble: 0}, background} as unknown as Theme} />
      <Background background={background} />
      <MediaLayer theme={theme} props={props} timeline={timeline} />
      {fontsReady &&
        props.slides.map((slide, i) => <SlideText key={i} theme={theme} slide={slide} item={timeline.items[i]} x={x} />)}
      <PhraseAudio theme={theme} slides={props.slides} timeline={timeline} />
    </AbsoluteFill>
  );
};
