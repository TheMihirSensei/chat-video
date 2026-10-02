// Renders scripts/placeholder-gif/Scene.tsx to a looping transparent GIF at public/gifs/cozy.gif.
// Run with: node scripts/placeholder-gif/make-gif.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderFrames, selectComposition} from '@remotion/renderer';
import gifenc from 'gifenc';
import {PNG} from 'pngjs';

const {GIFEncoder, quantize, applyPalette} = gifenc;
const root = process.cwd();
const out = path.join(root, 'public/gifs/cozy.gif');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gif-frames-'));

const serveUrl = await bundle({entryPoint: path.join(root, 'scripts/placeholder-gif/Scene.tsx')});
const composition = await selectComposition({serveUrl, id: 'PlaceholderGif'});
await renderFrames({composition, serveUrl, outputDir: tmp, imageFormat: 'png', inputProps: {}, onStart: () => {}});

const files = fs.readdirSync(tmp).filter((f) => f.endsWith('.png')).sort();
const frames = files.map((f) => PNG.sync.read(fs.readFileSync(path.join(tmp, f))));
const {width, height} = frames[0];

// One shared palette for every frame so colors don't flicker.
const all = new Uint8Array(frames.reduce((n, f) => n + f.data.length, 0));
let offset = 0;
for (const f of frames) {
  all.set(f.data, offset);
  offset += f.data.length;
}
const palette = quantize(all, 256, {format: 'rgba4444', oneBitAlpha: true});
const transparentIndex = Math.max(0, palette.findIndex((c) => c[3] === 0));

const gif = GIFEncoder();
for (const f of frames) {
  const index = applyPalette(f.data, palette, 'rgba4444');
  gif.writeFrame(index, width, height, {palette, delay: 1000 / composition.fps, transparent: true, transparentIndex, repeat: 0});
}
gif.finish();
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, gif.bytes());
fs.rmSync(tmp, {recursive: true, force: true});
console.log(`wrote ${path.relative(root, out)} (${frames.length} frames, ${width}x${height})`);
