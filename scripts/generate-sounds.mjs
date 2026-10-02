// Synthesizes the small "sent" / "received" message sounds into public/sounds/.
// Run with: npm run sounds
import fs from 'node:fs';
import path from 'node:path';

const RATE = 44100;

const writeWav = (file, samples) => {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, Buffer.concat([header, data]));
  console.log(`wrote ${file}`);
};

/** Sine tone with a pitch glide and exponential decay. */
const tone = ({from, to, duration, decay, gain = 0.6, start = 0}) => {
  const out = new Float32Array(Math.round((start + duration) * RATE));
  let phase = 0;
  for (let i = Math.round(start * RATE); i < out.length; i++) {
    const t = i / RATE - start;
    const freq = from + (to - from) * (t / duration);
    phase += (2 * Math.PI * freq) / RATE;
    const attack = Math.min(1, t / 0.004);
    out[i] = Math.sin(phase) * Math.exp(-t * decay) * attack * gain;
  }
  return out;
};

const mix = (...tracks) => {
  const out = new Float32Array(Math.max(...tracks.map((t) => t.length)));
  for (const t of tracks) t.forEach((v, i) => (out[i] += v));
  return out;
};

writeWav('public/sounds/sent.wav', tone({from: 900, to: 520, duration: 0.12, decay: 32}));
writeWav(
  'public/sounds/received.wav',
  mix(tone({from: 660, to: 660, duration: 0.16, decay: 28, gain: 0.45}), tone({from: 990, to: 990, duration: 0.22, decay: 22, gain: 0.45, start: 0.08})),
);
