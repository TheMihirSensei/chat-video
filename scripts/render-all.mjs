// Batch-renders every chat in chats/ to out/<name>.mp4.
//
// Usage:
//   npm run render:all
//   npm run render:all -- --theme=custom
//   npm run render:all -- --theme=custom --format=horizontal --only=chat1,chat2
//
// Options:
//   --theme=<name>        theme file in themes/ (overrides a "theme" set inside the chat file)
//   --format=<f>          vertical (1080x1920) | horizontal (1920x1080)
//   --chats=<dir>         input folder (default: chats)
//   --out=<dir>           output folder (default: out)
//   --only=<a,b>          only render these chat names
//   --concurrency=<n>     frames rendered in parallel (default: Remotion's choice)
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.length ? rest.join('=') : 'true'];
  }),
);

const root = process.cwd();
const chatsDir = path.resolve(root, args.chats ?? 'chats');
const outDir = path.resolve(root, args.out ?? 'out');
const only = args.only ? new Set(args.only.split(',').map((s) => s.trim())) : null;

if (args.theme && !fs.existsSync(path.join(root, 'themes', `${args.theme}.json`))) {
  console.error(`Theme "${args.theme}" not found in themes/`);
  process.exit(1);
}
if (args.format && !['vertical', 'horizontal'].includes(args.format)) {
  console.error('--format must be "vertical" or "horizontal"');
  process.exit(1);
}

const files = fs
  .readdirSync(chatsDir)
  .filter((f) => f.endsWith('.json'))
  .filter((f) => !only || only.has(path.basename(f, '.json')))
  .sort();

if (files.length === 0) {
  console.error(`No chat files found in ${chatsDir}`);
  process.exit(1);
}

fs.mkdirSync(outDir, {recursive: true});

console.log('Bundling project…');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), rootDir: root});

const failures = [];
for (const [i, file] of files.entries()) {
  const name = path.basename(file, '.json');
  const outputLocation = path.join(outDir, `${name}.mp4`);
  try {
    const chat = JSON.parse(fs.readFileSync(path.join(chatsDir, file), 'utf8'));
    const inputProps = {
      ...chat,
      ...(args.theme ? {theme: args.theme} : {}),
      ...(args.format ? {format: args.format} : {}),
    };
    const composition = await selectComposition({serveUrl, id: 'ChatVideo', inputProps});
    console.log(
      `[${i + 1}/${files.length}] ${file} → ${path.relative(root, outputLocation)} ` +
        `(${composition.width}x${composition.height}, ${(composition.durationInFrames / composition.fps).toFixed(1)}s, theme: ${inputProps.theme ?? 'default'})`,
    );
    let lastPct = -1;
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      imageFormat: 'jpeg',
      outputLocation,
      inputProps,
      concurrency: args.concurrency ? Number(args.concurrency) : null,
      onProgress: ({progress}) => {
        const pct = Math.floor(progress * 100);
        if (pct % 10 === 0 && pct !== lastPct) {
          lastPct = pct;
          process.stdout.write(`  ${pct}%${pct === 100 ? '\n' : ''}`);
        }
      },
    });
  } catch (err) {
    console.error(`\n  ✗ Failed to render ${file}: ${err.message}`);
    failures.push(file);
  }
}

console.log(`\nDone: ${files.length - failures.length}/${files.length} rendered to ${path.relative(root, outDir) || '.'}`);
if (failures.length) {
  console.log(`Failed: ${failures.join(', ')}`);
  process.exit(1);
}
