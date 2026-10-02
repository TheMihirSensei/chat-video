import type {Theme} from '../theme';
import type {Format} from '../types';
import type {PhraseThemeInput} from './theme';

export type PhraseSlide = {
  /** Main (Japanese) text. Use "\n" to force a line break. */
  text: string;
  /** English translation shown under it. */
  translation?: string;
  /** Optional romaji / furigana line. */
  reading?: string;
  /** Voice clip in public/. The slide stays up at least as long as the audio. */
  audio?: string;
  /** Play the audio this many times. Default 1. */
  repeat?: number;
  /** Seconds the slide stays fully visible (overrides the automatic length). */
  duration?: number;
  /** Different GIF/image/video for this slide (cross-fades from the previous one). */
  media?: string;
};

export type PhraseProps = {
  theme?: string | PhraseThemeInput;
  format?: Format;
  /** Quick background override, e.g. {"type": "image", "src": "backgrounds/paper.png"}. */
  background?: Partial<Theme['background']>;
  /** GIF (transparent works), image, or video in public/ shown beside the text. */
  media?: string;
  slides: PhraseSlide[];
  /** Filled in automatically from the audio files; don't set by hand. */
  audioDurations?: (number | null)[];
};
