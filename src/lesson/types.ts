import type {Theme} from '../theme';
import type {Format} from '../types';
import type {LessonThemeInput} from './theme';

export type CharacterDef = {
  /** Image in public/ (e.g. "characters/ghost.png") or a URL. Transparent PNG/SVG works best. */
  image: string;
  /** Which end of the card the character stands at. The text aligns to the other end. */
  side?: 'left' | 'right';
  /** Height in px; overrides the theme's character.height. */
  height?: number;
  /** Nudge the character outward (+) / inward (-) and down (+) / up (-). */
  offsetX?: number;
  offsetY?: number;
  /** Mirror the image horizontally. */
  flip?: boolean;
};

export type LessonLine = {
  /** Key into `characters`. */
  character: string;
  /** Main (Japanese) text. */
  text: string;
  /** Translation shown under the text, e.g. "Good morning". */
  translation?: string;
  /** Optional reading (romaji / furigana) shown between text and translation. */
  reading?: string;
  /** Voice clip in public/ (e.g. "audio/ohayou.mp3"). The line lasts as long as the audio. */
  audio?: string;
  /** Play the audio this many times (good for repeat-after-me). Default 1. */
  repeat?: number;
  /** Seconds to wait after this line before the next one. Overrides the theme. */
  pause?: number;
  /** Seconds the line is spoken/held when there is no audio. */
  duration?: number;
};

export type LessonProps = {
  theme?: string | LessonThemeInput;
  format?: Format;
  /** Upper text shown above the cards. */
  title?: string;
  subtitle?: string;
  /** Quick background override, e.g. {"type": "image", "src": "backgrounds/sky.png"}. */
  background?: Partial<Theme['background']>;
  /** Characters by id. Merged over the theme's characters. */
  characters?: Record<string, CharacterDef>;
  lines: LessonLine[];
  /** Filled in automatically from the audio files; don't set by hand. */
  audioDurations?: (number | null)[];
};
