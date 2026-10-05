import {graphemeCount} from '../timing';
import type {LessonTheme} from './theme';
import type {LessonLine, LessonProps, LessonSlide} from './types';

export type AudioPlay = {src: string; start: number; frames: number};

export type LessonTimelineItem = {
  characterIn: number;
  cardIn: number;
  textIn: number;
  /** Every clip play for this line, in order (Japanese ×N and English ×M). */
  plays: AudioPlay[];
  /** Frame the line is finished (audio done). */
  end: number;
};

export type LessonSlideTiming = {
  start: number;
  lines: LessonTimelineItem[];
  /** Cards start leaving (null = the last slide stays until the end). */
  outStart: number | null;
  /** Fully gone. */
  end: number;
};

export type LessonTimeline = {slides: LessonSlideTiming[]; durationInFrames: number};

/** Slides from the file: explicit `slides`, or the older flat `lines` grouped by theme.layout.linesPerSlide. */
export const getLessonSlides = (props: Pick<LessonProps, 'slides' | 'lines'>, theme: LessonTheme): LessonSlide[] => {
  if (props.slides?.length) return props.slides;
  const lines = props.lines ?? [];
  const size = Math.max(1, theme.layout.linesPerSlide);
  return Array.from({length: Math.ceil(lines.length / size)}, (_, i) => ({lines: lines.slice(i * size, i * size + size)}));
};

/**
 * Per slide: each line's picture appears → card appears → text → audio (Japanese and
 * English clips, each repeated as configured), with thinking time between lines
 * (question → answer). Then the slide holds, its cards leave, and the next slide starts
 * on a clean screen.
 *
 * The duration arrays are indexed by the line's position across all slides.
 */
export const computeLessonTimeline = (
  slides: LessonSlide[],
  audioDurations: (number | null)[] | undefined,
  translationAudioDurations: (number | null)[] | undefined,
  theme: LessonTheme,
  fps: number,
): LessonTimeline => {
  const t = theme.timing;
  const a = theme.audio;
  const tr = theme.transition;
  const f = (seconds: number) => Math.round(seconds * fps);
  let cursor = f(t.startDelay);
  let flatIndex = 0;

  const lineTiming = (line: LessonLine): LessonTimelineItem => {
    const characterIn = cursor;
    const cardIn = characterIn + f(t.characterLead);
    const textIn = cardIn + f(t.textDelay);
    const audioStart = textIn + f(t.audioDelay);

    const japanese = {
      src: line.audio,
      seconds: line.audio ? audioDurations?.[flatIndex] ?? null : null,
      repeat: line.repeat ?? a.japaneseRepeat,
    };
    const english = {
      src: line.translationAudio,
      seconds: line.translationAudio ? translationAudioDurations?.[flatIndex] ?? null : null,
      repeat: line.translationRepeat ?? a.englishRepeat,
    };
    flatIndex++;

    const plays: AudioPlay[] = [];
    let playCursor = audioStart;
    const groups = a.order === 'english-first' ? [english, japanese] : [japanese, english];
    for (const group of groups) {
      if (!group.src || group.seconds === null || group.repeat < 1) continue;
      if (plays.length) playCursor += f(a.languageGap);
      const frames = Math.max(1, Math.ceil(group.seconds * fps));
      for (let k = 0; k < group.repeat; k++) {
        if (k > 0) playCursor += f(a.repeatGap);
        plays.push({src: group.src, start: playCursor, frames});
        playCursor += frames;
      }
    }

    const end = plays.length
      ? playCursor
      : audioStart + f(line.duration ?? Math.max(t.minLine, graphemeCount(line.text) * t.secondsPerChar));
    return {characterIn, cardIn, textIn, plays, end};
  };

  const timings = slides.map((slide, s): LessonSlideTiming => {
    const start = cursor;
    const lines = slide.lines.map((line, j) => {
      const item = lineTiming(line);
      cursor = item.end + (j < slide.lines.length - 1 ? f(line.pause ?? t.answerDelay) : 0);
      return item;
    });
    const holdUntil = cursor + f(t.slideHold);
    const leaves = s < slides.length - 1 || tr.outroLast;
    // The last card starts leaving after the others (stagger), then takes `duration`.
    const exitFrames = f(tr.duration + tr.stagger * Math.max(0, slide.lines.length - 1));
    const end = leaves ? holdUntil + exitFrames : holdUntil;
    cursor = end + f(t.slideGap);
    return {start, lines, outStart: leaves ? holdUntil : null, end};
  });

  const last = timings[timings.length - 1];
  return {slides: timings, durationInFrames: Math.max(1, (last ? last.end : 0) + f(t.endHold))};
};
