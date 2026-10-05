import type {Theme} from '../theme';
import {deepMerge, FORMAT_SIZES} from '../theme-utils';
import type {Format} from '../types';
import type {CharacterDef} from './types';

type FontSpec = {family: string; weights: number[]};

export type LessonTheme = {
  name: string;
  extends?: string;
  video: {format: Format; fps: number; width?: number | null; height?: number | null};
  /** Same options as the chat theme background (solid / gradient / image / video, panel…). */
  background: Theme['background'];
  fonts: {
    text: FontSpec;
    translation: FontSpec;
    /** Emoji font from Google Fonts, or null for system emoji. */
    emoji: string | null;
  };
  layout: {
    /** Left/right edge of the card column. */
    paddingX: number;
    /** Each slide's cards are centered vertically between top and bottom. */
    top: number;
    bottom: number;
    cardGap: number;
    /** How far the card stops short of the column edge on the character's side. */
    characterInset: number;
    /** Older flat "lines" files are split into slides of this many lines. */
    linesPerSlide: number;
  };
  card: {
    background: string;
    /** CSS border, e.g. "5px solid #111", or null. */
    border: string | null;
    radius: number;
    /** Hard offset shadow (comic style), or null. */
    shadow: {x: number; y: number; color: string} | null;
    paddingX: number;
    /** Extra padding on the character's side so long text never runs under it. */
    characterSidePadding: number;
    paddingY: number;
    minHeight: number;
    /** auto = align away from the character. */
    align: 'auto' | 'left' | 'right' | 'center';
    textSize: number;
    textWeight: number;
    textColor: string;
    translationSize: number;
    translationColor: string;
    /** How the translation is written; {t} is replaced, e.g. "({t})". */
    translationFormat: string;
    entrance: 'grow' | 'pop' | 'slide' | 'fade';
    textReveal: 'fade' | 'typewriter' | 'none';
    /** Seconds per character for the typewriter reveal. */
    typewriterSpeed: number;
  };
  character: {
    height: number;
    offsetX: number;
    offsetY: number;
    /** How the picture appears. Its own motion comes from the GIF itself. */
    entrance: 'pop' | 'slide' | 'drop' | 'fade' | 'none';
    /** contain = whole picture visible inside its box. */
    fit: 'contain' | 'cover' | 'fill';
    /** GIF / video playback speed. */
    speed: number;
  };
  /** Reusable picture presets for every lesson using this theme (lessons can add/override). */
  characters: Record<string, CharacterDef>;
  timing: {
    startDelay: number;
    /** Character appears this long before its card. */
    characterLead: number;
    /** Text appears this long after the card. */
    textDelay: number;
    /** Audio starts this long after the text. */
    audioDelay: number;
    /** Thinking time: pause after a line (e.g. the question) before the next line on the same slide. */
    answerDelay: number;
    /** Keep the finished slide on screen this long before it leaves. */
    slideHold: number;
    /** Gap after a slide has left before the next one starts. */
    slideGap: number;
    endHold: number;
    /** Lines with no audio at all: seconds per character, with a minimum. */
    secondsPerChar: number;
    minLine: number;
  };
  /** How each line's Japanese and English clips are played. */
  audio: {
    /** Times the Japanese clip (line.audio) plays. */
    japaneseRepeat: number;
    /** Times the English clip (line.translationAudio) plays. */
    englishRepeat: number;
    /** Which language is heard first. */
    order: 'japanese-first' | 'english-first';
    /** Gap between repeats of the same clip. */
    repeatGap: number;
    /** Gap when switching from one language to the other. */
    languageGap: number;
  };
  /** How a finished slide leaves the screen. */
  transition: {
    out: 'fade' | 'rise' | 'sink' | 'slideLeft' | 'shrink';
    duration: number;
    /** Delay between each card leaving (seconds), so they go one after another. */
    stagger: number;
    /** Also animate the last slide out at the end. */
    outroLast: boolean;
  };
  sounds: {
    /** Short effect when each card appears (path in public/), or null. */
    cardIn: string | null;
    characterIn: string | null;
    volume: number;
    voiceVolume: number;
  };
  music: {src: string | null; volume: number};
};

type DeepPartial<T> = {[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> | null : T[K]};
export type LessonThemeInput = DeepPartial<LessonTheme> & {extends?: string};

import {lessonThemeRegistry} from './theme-registry';
export {lessonThemeRegistry};

const resolveNamed = (name: string, seen: string[]): LessonTheme => {
  const json = lessonThemeRegistry[name];
  if (!json) {
    throw new Error(`Unknown lesson theme "${name}". Available: ${Object.keys(lessonThemeRegistry).join(', ')}`);
  }
  if (seen.includes(name)) throw new Error(`Theme inheritance loop: ${[...seen, name].join(' -> ')}`);
  if (name === 'default') return json as LessonTheme;
  return deepMerge(resolveNamed(json.extends ?? 'default', [...seen, name]), {...json, name});
};

export const resolveLessonTheme = (input: string | LessonThemeInput | undefined): LessonTheme => {
  if (input === undefined || typeof input === 'string') return resolveNamed(input ?? 'default', []);
  return deepMerge(resolveNamed(input.extends ?? 'default', []), input);
};

export const getLessonVideoSize = (theme: LessonTheme, format?: Format) => {
  const preset = FORMAT_SIZES[format ?? theme.video.format] ?? FORMAT_SIZES.horizontal;
  return {
    width: (!format && theme.video.width) || preset.width,
    height: (!format && theme.video.height) || preset.height,
  };
};
