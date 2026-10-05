// Renders the placeholder scenes in scripts/placeholder-gif/ to looping transparent GIFs:
//   public/gifs/cozy.gif (phrase videos), public/characters/ghost.gif + snowman.gif (lesson videos)
// Run with: npm run gif:placeholder
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderFrames, selectComposition} from '@remotion/renderer';
import gifenc from 'gifenc';
import {PNG} from 'pngjs';

const {GIFEncoder, quantize, applyPalette} = gifenc;
const root = process.cwd();
const targets = [
  {id: 'PlaceholderGif', out: 'public/gifs/cozy.gif'},
  {id: 'Ghost', out: 'public/characters/ghost.gif'},
  {id: 'Snowman', out: 'public/characters/snowman.gif'},
];

const serveUrl = await bundle({entryPoint: path.join(root, 'scripts/placeholder-gif/Scene.tsx')});

for (const target of targets) {
  const out = path.join(root, target.out);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gif-frames-'));
  const composition = await selectComposition({serveUrl, id: target.id});
  await renderFrames({composition, serveUrl, outputDir: tmp, imageFormat: 'png', inputProps: {}, onStart: () => {}});

  const files = fs.readdirSync(tmp).filter((f) => f.endsWith('.png')).sort();
  const frames = files.map((f) => PNG.sync.read(fs.readFileSync(path.join(tmp, f))));
  const {width, height} = frames[0];

  // One shared palette for every frame so colors don't flicker. It's built from opaque
  // pixels only, so transparent areas can't crowd out real colors (e.g. pure white),
  // and one extra entry is reserved for transparency.
  const ALPHA_CUTOFF = 128;
  const opaque = [];
  for (const f of frames) {
    for (let i = 0; i < f.data.length; i += 4) {
      if (f.data[i + 3] >= ALPHA_CUTOFF) opaque.push(f.data[i], f.data[i + 1], f.data[i + 2], 255);
    }
  }
  const palette = quantize(new Uint8Array(opaque), 255, {format: 'rgb565'});
  const transparentIndex = palette.length;
  palette.push([0, 0, 0]);

  const gif = GIFEncoder();
  for (const f of frames) {
    const index = applyPalette(f.data, palette.slice(0, transparentIndex), 'rgb565');
    for (let i = 0; i < index.length; i++) {
      if (f.data[i * 4 + 3] < ALPHA_CUTOFF) index[i] = transparentIndex;
    }
    // dispose 2 = clear each frame before drawing the next, so moving parts leave no trails.
    gif.writeFrame(index, width, height, {
      palette,
      delay: 1000 / composition.fps,
      transparent: true,
      transparentIndex,
      dispose: 2,
      repeat: 0,
    });
  }
  gif.finish();
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(out, gif.bytes());
  fs.rmSync(tmp, {recursive: true, force: true});
  console.log(`wrote ${path.relative(root, out)} (${frames.length} frames, ${width}x${height})`);
}
