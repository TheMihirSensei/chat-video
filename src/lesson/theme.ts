import {deepMerge, FORMAT_SIZES, type Theme} from '../theme';
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
    reading: FontSpec;
    title: FontSpec;
    /** Emoji font from Google Fonts, or null for system emoji. */
    emoji: string | null;
  };
  title: {
    show: boolean;
    size: number;
    weight: number;
    color: string;
    /** Outline color around the letters, or null. */
    stroke: string | null;
    strokeWidth: number;
    subtitleSize: number;
    subtitleColor: string;
    /** Distance from the top edge to the title's center. */
    top: number;
    align: 'left' | 'center' | 'right';
    /** true = title scrolls away with the cards; false = stays fixed and cards fade out under it. */
    scroll: boolean;
  };
  layout: {
    /** Left/right edge of the card column. */
    paddingX: number;
    /** Where the first card starts (leave room for the title). */
    top: number;
    bottom: number;
    cardGap: number;
    /** How far the card stops short of the column edge on the character's side. */
    characterInset: number;
    /** How much of the next (placeholder) card to keep in view when scrolling. */
    peek: number;
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
    readingSize: number;
    readingColor: string;
    translationSize: number;
    translationColor: string;
    /** How the translation is written; {t} is replaced, e.g. "({t})". */
    translationFormat: string;
    entrance: 'grow' | 'pop' | 'slide' | 'fade';
    textReveal: 'fade' | 'typewriter' | 'none';
    /** Seconds per character for the typewriter reveal. */
    typewriterSpeed: number;
  };
  /** Empty card shown where the next line will appear. */
  placeholder: {show: boolean; background: string; radius: number};
  character: {
    height: number;
    offsetX: number;
    offsetY: number;
    entrance: 'pop' | 'slide' | 'drop' | 'fade';
    /** Gentle floating while idle. */
    idle: 'bob' | 'none';
    idleAmplitude: number;
    /** Little bounce while its audio plays. */
    talk: 'bounce' | 'none';
  };
  /** Characters available to every lesson using this theme (lessons can add/override). */
  characters: Record<string, CharacterDef>;
  timing: {
    startDelay: number;
    /** Character appears this long before its card. */
    characterLead: number;
    /** Text appears this long after the card. */
    textDelay: number;
    /** Audio starts this long after the text. */
    audioDelay: number;
    /** Pause after a line's audio ends before the next character appears. */
    pauseBetween: number;
    /** Gap between repeats when a line's audio plays more than once. */
    repeatGap: number;
    endHold: number;
    /** Lines without audio: seconds per character, with a minimum. */
    secondsPerChar: number;
    minLine: number;
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

// Every *.json in /lesson-themes is bundled automatically, keyed by file name.
const themeContext = require.context('../../lesson-themes', false, /\.json$/);
export const lessonThemeRegistry: Record<string, LessonThemeInput> = Object.fromEntries(
  themeContext.keys().map((key) => [key.replace(/^\.\//, '').replace(/\.json$/, ''), themeContext(key) as LessonThemeInput]),
);

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
