import type {LessonThemeInput} from '../../src/lesson/theme';

// Vite version of src/lesson/theme-registry.ts: every *.json in /lesson-themes, keyed by file name.
const modules = import.meta.glob('../../lesson-themes/*.json', {eager: true, import: 'default'});

export const lessonThemeRegistry: Record<string, LessonThemeInput> = Object.fromEntries(
  Object.entries(modules).map(([file, json]) => [file.split('/').pop()!.replace(/\.json$/, ''), json as LessonThemeInput]),
);
