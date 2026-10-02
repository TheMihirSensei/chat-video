import {graphemeCount} from '../timing';
import type {LessonTheme} from './theme';
import type {LessonLine} from './types';

export type LessonTimelineItem = {
  characterIn: number;
  cardIn: number;
  textIn: number;
  /** Start frame of each audio play (empty when the line has no audio). */
  audioPlays: number[];
  /** Length of one audio play in frames. */
  audioFrames: number;
  /** Frame the line is finished (audio done). */
  end: number;
};

export type LessonTimeline = {items: LessonTimelineItem[]; durationInFrames: number};

/**
 * Per line: character appears → card appears → text appears → audio plays
 * (optionally repeated) → pause → next line. Lines last as long as their audio.
 */
export const computeLessonTimeline = (
  lines: LessonLine[],
  audioDurations: (number | null)[] | undefined,
  theme: LessonTheme,
  fps: number,
): LessonTimeline => {
  const t = theme.timing;
  const f = (seconds: number) => Math.round(seconds * fps);
  let cursor = f(t.startDelay);

  const items = lines.map((line, i): LessonTimelineItem => {
    const characterIn = cursor;
    const cardIn = characterIn + f(t.characterLead);
    const textIn = cardIn + f(t.textDelay);
    const audioStart = textIn + f(t.audioDelay);
    const seconds = line.audio ? audioDurations?.[i] ?? null : null;

    let audioPlays: number[] = [];
    let audioFrames = 0;
    let end: number;
    if (seconds !== null) {
      audioFrames = Math.max(1, Math.ceil(seconds * fps));
      const repeat = Math.max(1, line.repeat ?? 1);
      audioPlays = Array.from({length: repeat}, (_, k) => audioStart + k * (audioFrames + f(t.repeatGap)));
      end = audioPlays[repeat - 1] + audioFrames;
    } else {
      const hold = line.duration ?? Math.max(t.minLine, graphemeCount(line.text) * t.secondsPerChar);
      end = audioStart + f(hold);
    }
    cursor = end + f(line.pause ?? t.pauseBetween);
    return {characterIn, cardIn, textIn, audioPlays, audioFrames, end};
  });

  const last = items[items.length - 1];
  return {items, durationInFrames: Math.max(1, (last ? last.end : 0) + f(t.endHold))};
};
