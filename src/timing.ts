import type {Theme} from './theme';
import type {Message} from './types';

export type TimelineItem = {
  index: number;
  /** Whether a typing indicator is shown before this message. */
  showTyping: boolean;
  /** Frame the typing indicator appears. */
  typingStart: number;
  /** Frame the bubble appears (typing indicator disappears). */
  appear: number;
  /** Frame person A's message is marked as read (blue ticks). */
  readAt: number;
};

export type Timeline = {
  items: TimelineItem[];
  durationInFrames: number;
};

const segmenter = new Intl.Segmenter(undefined, {granularity: 'grapheme'});

/** Counts visible characters, treating each emoji (incl. ZWJ sequences) as one. */
export const graphemeCount = (text: string) => Array.from(segmenter.segment(text)).length;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const typingSeconds = (message: Message, theme: Theme) => {
  if (typeof message.typing === 'number') return message.typing;
  const {typingPerChar, minTyping, maxTyping} = theme.timing;
  return clamp(graphemeCount(message.text) * typingPerChar, minTyping, maxTyping);
};

export const computeTimeline = (messages: Message[], theme: Theme, fps: number): Timeline => {
  const t = theme.timing;
  let cursor = t.startDelay * fps;
  const items: TimelineItem[] = messages.map((message, index) => {
    cursor += (message.delay ?? 0) * fps;
    const typingStart = Math.round(cursor);
    const appear = typingStart + Math.max(1, Math.round(typingSeconds(message, theme) * fps));
    cursor = appear + t.pauseBetween * fps;
    return {
      index,
      showTyping: message.from === 'B' || theme.typing.showForA,
      typingStart,
      appear,
      readAt: 0,
    };
  });

  // A's message turns "read" when B starts typing a reply, or after readDelay otherwise.
  items.forEach((item, i) => {
    const nextB = items.slice(i + 1).find((other) => messages[other.index].from === 'B');
    const fallback = item.appear + Math.round(t.readDelay * fps);
    item.readAt = nextB ? Math.min(nextB.typingStart, fallback) : fallback;
  });

  const last = items[items.length - 1];
  const durationInFrames = Math.max(1, Math.round((last ? last.appear : 0) + t.endHold * fps));
  return {items, durationInFrames};
};

/** Timestamp for a message: explicit `time`, or startTime + index * minutesPerMessage. */
export const messageTime = (message: Message, index: number, theme: Theme) => {
  if (message.time) return message.time;
  const [h, m] = theme.meta.startTime.split(':').map(Number);
  const total = (h * 60 + m + Math.floor(index * theme.meta.minutesPerMessage)) % (24 * 60);
  const hours = Math.floor(total / 60);
  const minutes = String(total % 60).padStart(2, '0');
  if (theme.meta.clock === '12h') {
    return `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
  }
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};
