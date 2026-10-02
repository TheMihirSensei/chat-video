import {graphemeCount} from '../timing';
import type {PhraseTheme} from './theme';
import type {PhraseSlide} from './types';

export type PhraseTimelineItem = {
  /** Japanese text starts coming in. */
  start: number;
  translationIn: number;
  /** Start frame of each audio play. */
  audioPlays: number[];
  audioFrames: number;
  /** Text starts leaving (null = stays until the end). */
  outStart: number | null;
  /** Fully gone. */
  end: number;
};

export type PhraseTimeline = {items: PhraseTimelineItem[]; durationInFrames: number};

/** Frames the main text needs to finish its entrance animation. */
export const textInFrames = (slide: PhraseSlide, theme: PhraseTheme, fps: number) => {
  const a = theme.animation;
  const chars = graphemeCount(slide.text.replace(/\s/g, ''));
  if (a.textIn === 'chars' || a.textIn === 'typewriter') {
    return Math.round((chars * a.charStagger + (a.textIn === 'chars' ? a.textInDuration : 0)) * fps);
  }
  return a.textIn === 'none' ? 0 : Math.round(a.textInDuration * fps);
};

/**
 * Per slide: text in → translation in → audio (repeated if asked) → hold → text out → gap.
 * A slide stays at least until its audio and entrance animations are done.
 */
export const computePhraseTimeline = (
  slides: PhraseSlide[],
  audioDurations: (number | null)[] | undefined,
  theme: PhraseTheme,
  fps: number,
): PhraseTimeline => {
  const t = theme.timing;
  const a = theme.animation;
  const f = (s: number) => Math.round(s * fps);
  let cursor = f(t.startDelay);

  const items = slides.map((slide, i): PhraseTimelineItem => {
    const start = cursor;
    const translationIn = start + f(t.translationDelay);
    const audioStart = start + f(t.audioDelay);
    const seconds = slide.audio ? audioDurations?.[i] ?? null : null;

    let audioPlays: number[] = [];
    let audioFrames = 0;
    let spokenUntil = start;
    if (seconds !== null) {
      audioFrames = Math.max(1, Math.ceil(seconds * fps));
      const repeat = Math.max(1, slide.repeat ?? 1);
      audioPlays = Array.from({length: repeat}, (_, k) => audioStart + k * (audioFrames + f(t.repeatGap)));
      spokenUntil = audioPlays[repeat - 1] + audioFrames;
    }

    const readingTime = start + f(Math.max(t.minSlide, graphemeCount(slide.text) * t.secondsPerChar));
    const animationsDone = Math.max(
      start + textInFrames(slide, theme, fps),
      translationIn + f(a.translationInDuration),
    );
    const holdUntil =
      slide.duration !== undefined
        ? start + f(slide.duration)
        : Math.max(spokenUntil, readingTime, animationsDone) + f(t.holdAfter);

    const isLast = i === slides.length - 1;
    const leaves = !isLast || a.outroLast;
    const outStart = leaves ? holdUntil : null;
    const end = leaves ? holdUntil + f(a.textOutDuration) : holdUntil;
    cursor = end + f(t.gap);
    return {start, translationIn, audioPlays, audioFrames, outStart, end};
  });

  const last = items[items.length - 1];
  return {items, durationInFrames: Math.max(1, (last ? last.end : 0) + f(t.endHold))};
};
