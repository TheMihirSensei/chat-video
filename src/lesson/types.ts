import type {Theme} from '../theme';
import type {Format} from '../types';
import type {LessonThemeInput} from './theme';

/** How a line's picture is shown. Every field can be set per line or in a reusable character. */
export type CharacterDef = {
  /** GIF (transparent works), PNG, SVG or .webm in public/, e.g. "characters/ghost.gif", or a URL. */
  image?: string;
  /** Which end of the card the picture stands at. The text aligns to the other end. */
  side?: 'left' | 'right';
  /** Height in px; overrides the theme's character.height. */
  height?: number;
  /** Nudge the picture outward (+) / inward (-) and down (+) / up (-). */
  offsetX?: number;
  offsetY?: number;
  /** Mirror the picture horizontally. */
  flip?: boolean;
};

export type LessonLine = CharacterDef & {
  /** Optional preset from `characters`; any picture fields on the line override it. */
  character?: string;
  /** Main (Japanese) text. */
  text: string;
  /** English translation shown under the text, e.g. "Good morning". */
  translation?: string;
  /** Japanese voice clip in public/ (e.g. "audio/ohayou.mp3"). */
  audio?: string;
  /** English voice clip in public/ for the translation. */
  translationAudio?: string;
  /** How many times the Japanese clip plays. Overrides theme audio.japaneseRepeat. */
  repeat?: number;
  /** How many times the English clip plays. Overrides theme audio.englishRepeat. */
  translationRepeat?: number;
  /** Seconds to wait after this line before the next line on the same slide (thinking time). Overrides the theme. */
  pause?: number;
  /** Seconds the line is held when it has no audio at all. */
  duration?: number;
};

/** One self-contained scene, e.g. a question and its answer. */
export type LessonSlide = {
  lines: LessonLine[];
};

export type LessonProps = {
  theme?: string | LessonThemeInput;
  format?: Format;
  /** Quick background override, e.g. {"type": "image", "src": "backgrounds/sky.png"}. */
  background?: Partial<Theme['background']>;
  /** Optional reusable presets (image, side, size…), referenced by a line's `character`. Merged over the theme's. */
  characters?: Record<string, CharacterDef>;
  /** Each slide is shown on its own and cleared before the next one. */
  slides?: LessonSlide[];
  /** Older format: a flat list of lines, grouped into slides of theme.layout.linesPerSlide. */
  lines?: LessonLine[];
  /** Filled in automatically from the audio files; don't set by hand. */
  audioDurations?: (number | null)[];
  translationAudioDurations?: (number | null)[];
};
