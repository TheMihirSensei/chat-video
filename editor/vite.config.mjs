import path from 'node:path';
import {fileURLToPath} from 'node:url';

const editorDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(editorDir, '..');

export default {
  root: editorDir,
  // public/ is served by the Express server (so new uploads appear immediately).
  publicDir: false,
  plugins: [
    {
      // src/lesson/theme-registry.ts uses webpack's require.context (Remotion's bundler).
      // In the editor, swap it for a version built on Vite's import.meta.glob.
      name: 'lesson-theme-registry',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source === './theme-registry' && importer?.replace(/\\/g, '/').endsWith('/src/lesson/theme.ts')) {
          return path.join(editorDir, 'src/lesson-theme-registry.ts');
        }
        return null;
      },
    },
  ],
  oxc: {jsx: {runtime: 'automatic'}},
  server: {fs: {allow: [root]}},
};
