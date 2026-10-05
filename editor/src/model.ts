import {resolveLessonTheme, type LessonThemeInput} from '../../src/lesson/theme';
import type {LessonLine, LessonProps, LessonSlide} from '../../src/lesson/types';
import {deepMerge} from '../../src/theme-utils';

/** A lesson as edited here: always the `slides` format. */
export type Lesson = Omit<LessonProps, 'lines' | 'slides'> & {slides: LessonSlide[]};

export const ROLE_NAMES = ['Question', 'Answer'];

/** Accepts both file formats (slides, or an older flat `lines` list) and returns slides. */
export const normalizeLesson = (raw: unknown): Lesson => {
  const json = (raw ?? {}) as LessonProps;
  const {lines, slides, audioDurations: _a, translationAudioDurations: _b, ...rest} = json;
  if (slides?.length) return {...rest, slides};
  const flat = lines ?? [];
  const grouped: LessonSlide[] = [];
  for (let i = 0; i < flat.length; i += 2) grouped.push({lines: flat.slice(i, i + 2)});
  return {...rest, slides: grouped};
};

const PICTURE_KEYS = ['image', 'side', 'height', 'offsetX', 'offsetY', 'flip', 'character'] as const;

/** A blank line that reuses the picture settings of `template` (e.g. the same line on the previous slide). */
export const blankLine = (side: 'left' | 'right', template?: LessonLine): LessonLine => {
  const line: LessonLine = {side, text: '', translation: ''};
  if (template) {
    for (const key of PICTURE_KEYS) {
      if (template[key] !== undefined) (line as Record<string, unknown>)[key] = template[key];
    }
  }
  return line;
};

export const newSlide = (previous?: LessonSlide): LessonSlide => ({
  lines: [blankLine('right', previous?.lines[0]), blankLine('left', previous?.lines[1])],
});

export const newLesson = (): Lesson => ({theme: 'default', slides: [newSlide()]});

// ---------- Lesson-wide settings, stored as an inline theme override in the lesson file.
export type LessonSettings = {
  englishRepeat: number;
  japaneseRepeat: number;
  order: 'english-first' | 'japanese-first';
  answerDelay: number;
};

export const getSettings = (lesson: Lesson): LessonSettings => {
  const theme = resolveLessonTheme(lesson.theme);
  return {
    englishRepeat: theme.audio.englishRepeat,
    japaneseRepeat: theme.audio.japaneseRepeat,
    order: theme.audio.order,
    answerDelay: theme.timing.answerDelay,
  };
};

export const applySettings = (lesson: Lesson, settings: LessonSettings): Lesson => {
  const patch: LessonThemeInput = {
    audio: {englishRepeat: settings.englishRepeat, japaneseRepeat: settings.japaneseRepeat, order: settings.order},
    timing: {answerDelay: settings.answerDelay},
  };
  const base: LessonThemeInput =
    typeof lesson.theme === 'object' && lesson.theme ? lesson.theme : {extends: lesson.theme ?? 'default'};
  return {...lesson, theme: deepMerge(base, patch)};
};

// ---------- Validation (shown in the editor; the video can't render without these)
export type Issue = {slide: number; line: number; message: string};

export const findIssues = (lesson: Lesson): Issue[] => {
  const issues: Issue[] = [];
  lesson.slides.forEach((slide, s) => {
    if (!slide.lines.length) issues.push({slide: s, line: -1, message: 'has no lines'});
    slide.lines.forEach((line, l) => {
      if (!line.image && !line.character) issues.push({slide: s, line: l, message: 'needs a GIF'});
      if (!line.text?.trim()) issues.push({slide: s, line: l, message: 'needs Japanese text'});
    });
  });
  return issues;
};

export const describeIssue = (issue: Issue) =>
  `Slide ${issue.slide + 1}${issue.line >= 0 ? ` · ${ROLE_NAMES[issue.line] ?? `Line ${issue.line + 1}`}` : ''} ${issue.message}`;
