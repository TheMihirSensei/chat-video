import {deepMerge, FORMAT_SIZES} from './theme-utils';
import type {Format} from './types';

export {deepMerge, FORMAT_SIZES};

export type Entrance = 'pop' | 'slide' | 'fade' | 'bounce';
/** speech = comic-style spike under the bubble, pointing down toward the avatar. */
export type TailStyle = 'curved' | 'triangle' | 'speech' | 'none';

export type BubbleColors = {
  /** Any CSS background: color, rgba() for transparency, or a gradient. */
  background: string;
  textColor: string;
  /** Glow color (CSS color) or null. */
  glow: string | null;
  glowSize: number;
  /** Whole-bubble opacity, 0..1. */
  opacity: number;
  /** CSS border, e.g. "2px solid rgba(255,255,255,0.2)", or null. */
  border: string | null;
  metaColor: string;
  /** Tail color when the background is a gradient (tail is drawn separately). null = background. */
  tailColor: string | null;
};

export type Theme = {
  name: string;
  extends?: string;
  video: {
    format: Format;
    fps: number;
    /** Optional explicit size; overrides the format preset. */
    width?: number | null;
    height?: number | null;
  };
  background: {
    type: 'solid' | 'gradient' | 'image' | 'video';
    color: string;
    gradient: string;
    /** Path inside public/ or a URL (for image / video). */
    src: string | null;
    /** CSS color drawn over the background (e.g. to darken an image). */
    overlay: string | null;
    blur: number;
    /** Optional colored panel drawn on top of the background (e.g. a hand-drawn card). */
    panel: {
      color: string;
      /** Distance from the canvas edges in px. */
      inset: number;
      radius: number;
      /** Hand-drawn edge wobble strength in px (0 = clean edges). */
      wobble: number;
      /** Wave size for the filter wobble: lower = longer, smoother waves. */
      wobbleFrequency?: number;
      /** rect = rounded rectangle (+ optional filter wobble); blob = smooth hand-drawn outline. */
      shape?: 'rect' | 'blob';
      /** blob shape: length of the main wave along the edge, in px. */
      waveLength?: number;
    } | null;
  };
  font: {
    family: string;
    /** google = load from Google Fonts, local = load public/<file>, system = installed font. */
    source: 'google' | 'local' | 'system';
    file: string | null;
    weights: number[];
    /** Emoji font loaded from Google Fonts for consistent emoji rendering, or null for system emoji. */
    emojiFont: string | null;
  };
  layout: {
    /** bottom = messages enter at the bottom and push older ones up; top = fill from the top first. */
    anchor: 'bottom' | 'top';
    /** Max width of the chat column when no phone frame is shown. */
    chatMaxWidth: number;
    paddingX: number;
    paddingTop: number;
    paddingBottom: number;
    /** Gap between messages from different people. */
    messageGap: number;
    /** Gap between consecutive messages from the same person. */
    groupGap: number;
    /** Max bubble width as a fraction of the column width. */
    bubbleMaxWidth: number;
    /** Height (px) of the soft fade where messages scroll out under the header. 0 = hard edge. */
    fadeTop: number;
  };
  header: {
    show: boolean;
    /** bar = classic app header bar, logo = floating avatar + big outlined title. */
    variant: 'bar' | 'logo';
    /** Header title; null = person B's name. */
    title: string | null;
    /** Header avatar file (public/avatars/); null = person B's avatar. */
    avatar: string | null;
    /** Google Font for the title (logo variant); null = main font. */
    titleFont: string | null;
    titleWeight: number;
    titleSize: number;
    titleColor: string;
    /** Outline color around the title letters, or null. */
    titleStroke: string | null;
    titleStrokeWidth: number;
    showStatus: boolean;
    height: number;
    background: string;
    blur: number;
    borderBottom: string | null;
    textColor: string;
    statusColor: string;
    typingStatusColor: string;
    avatarSize: number;
    nameSize: number;
    statusSize: number;
    onlineText: string;
    typingText: string;
    showBackArrow: boolean;
    showCallIcons: boolean;
    /** Center the avatar/name (iMessage style) instead of left-aligned (WhatsApp style). */
    centered: boolean;
  };
  phoneFrame: {
    show: boolean;
    color: string;
    bezel: number;
    radius: number;
    margin: number;
    notch: boolean;
    /** Design width of the screen content before it is scaled into the frame. */
    contentWidth: number;
    shadow: string | null;
  };
  bubble: {
    radius: number;
    /** Minimum bubble width in px (short messages still get a roomy bubble). */
    minWidth: number;
    /** Radius of corners between grouped bubbles of the same person. */
    groupRadius: number;
    paddingX: number;
    paddingY: number;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    tail: TailStyle;
    tailSize: number;
    /** speech tail only: distance from the bubble's outer edge. */
    tailInset: number;
    /**
     * rect = rounded rectangle, roughened by `wobble` (filter);
     * blob = smooth hand-drawn outline whose edge wanders in/out by `wobble` px.
     */
    shape: 'rect' | 'blob';
    /** blob shape: length of the main wave along the edge, in px. */
    waveLength: number;
    /** Hand-drawn edge wobble strength in px (0 = clean edges). */
    wobble: number;
    /** Wave size: lower = longer, rolling waves; higher = small ripples. */
    wobbleFrequency: number;
    /** 0..1: gives every bubble its own lopsided corner shape (0 = symmetric). */
    irregular: number;
    /** Max tilt in degrees of the bubble shape (text stays straight). Varies per bubble. */
    tilt: number;
    /** first = tail on first bubble of a group (WhatsApp), last = on last (iMessage). */
    tailPosition: 'first' | 'last';
    /** CSS drop-shadow arguments, e.g. "0 2px 3px rgba(0,0,0,0.2)", or null. */
    shadow: string | null;
    backdropBlur: number;
    /** Render messages consisting of 1-3 emojis big, without a bubble. */
    emojiOnlyLarge: boolean;
    emojiOnlyScale: number;
    A: BubbleColors;
    B: BubbleColors;
  };
  typing: {
    style: 'dots' | 'pulse' | 'wave';
    dotColor: string;
    dotSize: number;
    dotGap: number;
    /** false = just dots floating next to the avatar, no bubble. */
    bubble: boolean;
    /** Bubble background for the indicator; null = use the typer's bubble background. */
    background: string | null;
    /** Show the indicator for person A (right side) too. */
    showForA: boolean;
    speed: number;
  };
  /** Small avatar shown under every bubble. */
  avatars: {
    show: boolean;
    size: number;
    background: string;
    border: string | null;
    /** Initials color when no avatar image exists; null = white on a colored circle. */
    initialsColor: string | null;
    /** Vertical gap between bubble and avatar (negative overlaps). */
    offsetY: number;
    /** Shift from the outer edge toward the center. */
    offsetX: number;
  };
  animation: {
    entrance: Entrance;
    /** Spring damping used for the scroll movement (higher = less bounce). */
    scrollDamping: number;
    scrollDuration: number;
  };
  timing: {
    startDelay: number;
    /** Seconds of typing per character. */
    typingPerChar: number;
    minTyping: number;
    maxTyping: number;
    /** Pause after a message appears before the next one starts typing. */
    pauseBetween: number;
    endHold: number;
    readDelay: number;
  };
  meta: {
    timestamps: boolean;
    startTime: string;
    minutesPerMessage: number;
    clock: '24h' | '12h';
    fontSize: number;
    readTicks: boolean;
    tickColor: string;
    readTickColor: string;
  };
  sounds: {
    sent: string | null;
    received: string | null;
    /** Looped while the typing indicator is visible. */
    typing: string | null;
    volume: number;
  };
  music: {
    src: string | null;
    volume: number;
  };
};

type DeepPartial<T> = {[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> | null : T[K]};
export type ThemeInput = DeepPartial<Theme> & {extends?: string};

// Every *.json file in /themes is bundled automatically, keyed by file name.
const themeContext = require.context('../themes', false, /\.json$/);
export const themeRegistry: Record<string, ThemeInput> = Object.fromEntries(
  themeContext.keys().map((key) => [key.replace(/^\.\//, '').replace(/\.json$/, ''), themeContext(key) as ThemeInput]),
);

const resolveNamed = (name: string, seen: string[]): Theme => {
  const json = themeRegistry[name];
  if (!json) {
    throw new Error(`Unknown theme "${name}". Available themes: ${Object.keys(themeRegistry).join(', ')}`);
  }
  if (seen.includes(name)) {
    throw new Error(`Theme inheritance loop: ${[...seen, name].join(' -> ')}`);
  }
  // Every theme ultimately builds on default.json so missing keys are always filled.
  if (name === 'default') return json as Theme;
  const base = resolveNamed(json.extends ?? 'default', [...seen, name]);
  return deepMerge(base, {...json, name});
};

export const resolveTheme = (input: string | ThemeInput | undefined): Theme => {
  if (input === undefined || typeof input === 'string') {
    return resolveNamed(input ?? 'default', []);
  }
  return deepMerge(resolveNamed(input.extends ?? 'default', []), input);
};


export const getVideoSize = (theme: Theme, format?: Format) => {
  const preset = FORMAT_SIZES[format ?? theme.video.format] ?? FORMAT_SIZES.vertical;
  return {
    width: (!format && theme.video.width) || preset.width,
    height: (!format && theme.video.height) || preset.height,
  };
};
