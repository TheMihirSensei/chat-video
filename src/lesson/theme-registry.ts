import type {LessonThemeInput} from './theme';

// Every *.json in /lesson-themes is bundled automatically, keyed by file name.
// (Remotion's webpack build. The lesson editor replaces this file with a Vite version:
// editor/src/lesson-theme-registry.ts)
const themeContext = require.context('../../lesson-themes', false, /\.json$/);
export const lessonThemeRegistry: Record<string, LessonThemeInput> = Object.fromEntries(
  themeContext.keys().map((key) => [key.replace(/^\.\//, '').replace(/\.json$/, ''), themeContext(key) as LessonThemeInput]),
);
