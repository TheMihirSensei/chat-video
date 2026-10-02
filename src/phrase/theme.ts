import {deepMerge, FORMAT_SIZES, type Theme} from '../theme';
import type {Format} from '../types';

export type TextIn = 'chars' | 'fade' | 'rise' | 'blur' | 'zoom' | 'typewriter' | 'none';
export type TextOut = 'fade' | 'rise' | 'sink' | 'blur' | 'none';

export type TextStyle = {
  font: string;
  weights: number[];
  size: number;
  weight: number;
  color: string;
  lineHeight: number;
  letterSpacing: number;
  /** Outline color, or null. */
  stroke: string | null;
  strokeWidth: number;
  /** Space above this line, in px. */
  marginTop: number;
};

export type PhraseTheme = {
  name: string;
  extends?: string;
  video: {format: Format; fps: number; width?: number | null; height?: number | null};
  background: Theme['background'];
  emojiFont: string | null;
  media: {
    show: boolean;
    /** Which side of the screen the GIF sits on. The text goes on the other side. */
    side: 'left' | 'right';
    /** Size of the media box as a fraction of the video width / height. */
    width: number;
    height: number;
    /** Where the media sits vertically inside the video. */
    anchor: 'top' | 'center' | 'bottom';
    /** Push the box inward from the side edge (+) and down (+), in px. */
    offsetX: number;
    offsetY: number;
    /** contain = whole image visible, cover = fill the box (may crop). */
    fit: 'contain' | 'cover' | 'fill';
    /** GIF / video playback speed. */
    speed: number;
    entrance: 'fade' | 'rise' | 'zoom' | 'none';
    entranceDuration: number;
    /** Cross-fade length when a slide switches to a different media file. */
    crossfade: number;
  };
  text: {
    /**
     * Center of the text block as a fraction of the video width / height. null = centered in the free side.
     * x is written for media on the left; it's mirrored automatically when media.side is "right".
     */
    x: number | null;
    y: number;
    maxWidth: number;
    align: 'left' | 'center' | 'right';
    main: TextStyle;
    reading: TextStyle;
    translation: TextStyle;
    /** How the translation is written; {t} is replaced, e.g. "({t})". */
    translationFormat: string;
    showReading: boolean;
    showTranslation: boolean;
  };
  animation: {
    /** How the Japanese text comes in. chars = each character fades/rises in one after another. */
    textIn: TextIn;
    textInDuration: number;
    /** chars / typewriter: seconds between characters. */
    charStagger: number;
    /** How the reading / translation come in. */
    translationIn: TextIn;
    translationInDuration: number;
    /** How a slide leaves before the next one. */
    textOut: TextOut;
    textOutDuration: number;
    /** Also animate the last slide out at the end. */
    outroLast: boolean;
  };
  timing: {
    startDelay: number;
    /** Translation appears this long after the Japanese text starts. */
    translationDelay: number;
    /** Audio starts this long after the text starts. */
    audioDelay: number;
    /** Gap between repeats of a slide's audio. */
    repeatGap: number;
    /** Keep the slide on screen this long after its audio / reading time ends. */
    holdAfter: number;
    /** Slides without audio: seconds per character, with a minimum. */
    secondsPerChar: number;
    minSlide: number;
    /** Gap between one slide leaving and the next arriving. Negative = they overlap. */
    gap: number;
    endHold: number;
  };
  sounds: {
    /** Short effect when each slide appears (path in public/), or null. */
    slideIn: string | null;
    volume: number;
    voiceVolume: number;
  };
  music: {src: string | null; volume: number};
};

type DeepPartial<T> = {[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> | null : T[K]};
export type PhraseThemeInput = DeepPartial<PhraseTheme> & {extends?: string};

// Every *.json in /phrase-themes is bundled automatically, keyed by file name.
const themeContext = require.context('../../phrase-themes', false, /\.json$/);
export const phraseThemeRegistry: Record<string, PhraseThemeInput> = Object.fromEntries(
  themeContext.keys().map((key) => [key.replace(/^\.\//, '').replace(/\.json$/, ''), themeContext(key) as PhraseThemeInput]),
);

const resolveNamed = (name: string, seen: string[]): PhraseTheme => {
  const json = phraseThemeRegistry[name];
  if (!json) throw new Error(`Unknown phrase theme "${name}". Available: ${Object.keys(phraseThemeRegistry).join(', ')}`);
  if (seen.includes(name)) throw new Error(`Theme inheritance loop: ${[...seen, name].join(' -> ')}`);
  if (name === 'default') return json as PhraseTheme;
  return deepMerge(resolveNamed(json.extends ?? 'default', [...seen, name]), {...json, name});
};

export const resolvePhraseTheme = (input: string | PhraseThemeInput | undefined): PhraseTheme => {
  if (input === undefined || typeof input === 'string') return resolveNamed(input ?? 'default', []);
  return deepMerge(resolveNamed(input.extends ?? 'default', []), input);
};

export const getPhraseVideoSize = (theme: PhraseTheme, format?: Format) => {
  const preset = FORMAT_SIZES[format ?? theme.video.format] ?? FORMAT_SIZES.horizontal;
  return {
    width: (!format && theme.video.width) || preset.width,
    height: (!format && theme.video.height) || preset.height,
  };
};
