import type {ThemeInput} from './theme';

export type PersonId = 'A' | 'B';

export type Person = {
  name: string;
  /** File in public/avatars/ (or public/), or an http(s) URL. Falls back to initials. */
  avatar?: string | null;
};

export type Message = {
  from: PersonId;
  text: string;
  /** Optional timestamp shown in the bubble, e.g. "21:05". Auto-generated if omitted. */
  time?: string;
  /** Extra pause (seconds) before this message starts. */
  delay?: number;
  /** Override the typing duration (seconds) for this message. */
  typing?: number;
};

export type Format = 'vertical' | 'horizontal';

export type ChatProps = {
  people: Record<PersonId, Person>;
  messages: Message[];
  /** Theme name (file in themes/ without .json) or an inline theme object. */
  theme?: string | ThemeInput;
  /** Overrides the theme's video.format. */
  format?: Format;
};
