import React, {useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender} from 'remotion';

/** Deterministic 0..1 pseudo-random number. */
export const rand = (seed: number, k: number) => {
  const x = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export type BlobOptions = {
  radius: number;
  /** How far the edge wanders in and out, in px. */
  amplitude: number;
  /** Length of the main wave along the edge, in px. */
  waveLength: number;
  /** 0..1: lopsided corners (each corner gets its own radius). */
  irregular: number;
  seed: number;
};

/**
 * Builds a closed, hand-drawn-looking outline for a w×h box: a rounded rectangle
 * with uneven corners whose edge is pushed in and out by layered smooth waves.
 * The waves are tuned to divide the perimeter evenly so the shape closes seamlessly.
 */
export const blobPath = (w: number, h: number, o: BlobOptions, offset = 0) => {
  const maxR = Math.min(w, h) / 2;
  const corner = (k: number) => Math.min(maxR, o.radius * (1 + (rand(o.seed, k) - 0.5) * 1.2 * o.irregular));
  const [tl, tr, br, bl] = [corner(1), corner(2), corner(3), corner(4)];

  // Walk the rounded-rect perimeter, collecting points with outward normals.
  const pts: {x: number; y: number; nx: number; ny: number}[] = [];
  // ~6px steps, but capped at ~320 points: plenty for smooth curves, and very long
  // clip-path strings can fail to render.
  const STEP = Math.max(6, (2 * (w + h)) / 320);
  const line = (x1: number, y1: number, x2: number, y2: number, nx: number, ny: number) => {
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / STEP));
    for (let i = 0; i < n; i++) pts.push({x: x1 + ((x2 - x1) * i) / n, y: y1 + ((y2 - y1) * i) / n, nx, ny});
  };
  const arc = (cx: number, cy: number, r: number, from: number) => {
    const n = Math.max(2, Math.round((r * Math.PI) / 2 / STEP));
    for (let i = 0; i < n; i++) {
      const a = from + ((Math.PI / 2) * i) / n;
      pts.push({x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, nx: Math.cos(a), ny: Math.sin(a)});
    }
  };
  line(tl, 0, w - tr, 0, 0, -1);
  arc(w - tr, tr, tr, -Math.PI / 2);
  line(w, tr, w, h - br, 1, 0);
  arc(w - br, h - br, br, 0);
  line(w - br, h, bl, h, 0, 1);
  arc(bl, h - bl, bl, Math.PI / 2);
  line(0, h - bl, 0, tl, -1, 0);
  arc(tl, tl, tl, Math.PI);

  // Perimeter length so each wave layer repeats a whole number of times.
  const lengths = [0];
  for (let i = 1; i < pts.length; i++) lengths.push(lengths[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const P = lengths[lengths.length - 1] + Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
  const layers = [
    // Mostly one rolling wave, a softer secondary wave, and a hint of hand jitter.
    {len: o.waveLength, weight: 0.72},
    {len: o.waveLength * 0.52, weight: 0.24},
    {len: o.waveLength * 0.27, weight: 0.04},
  ].map((layer, k) => ({
    cycles: Math.max(1, Math.round(P / layer.len)),
    phase: rand(o.seed, 10 + k) * Math.PI * 2,
    weight: layer.weight,
  }));

  const d = pts
    .map((p, i) => {
      const t = lengths[i] / P;
      const off = o.amplitude * layers.reduce((sum, l) => sum + Math.sin(t * l.cycles * Math.PI * 2 + l.phase) * l.weight, 0);
      return `${i === 0 ? 'M' : 'L'}${(p.x + p.nx * off + offset).toFixed(1)} ${(p.y + p.ny * off + offset).toFixed(1)}`;
    })
    .join(' ');
  return `${d} Z`;
};

/** Fills its (absolutely positioned) box with a blob shape. Measures itself once. */
export const BlobFill: React.FC<{background: string; options: BlobOptions; style?: React.CSSProperties}> = ({
  background,
  options,
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{w: number; h: number} | null>(null);
  const [handle] = useState(() => delayRender('Measuring blob'));
  useLayoutEffect(() => {
    // The box can still be 0×0 on the very first layout (before the composition is shown),
    // so keep watching until it has a real size.
    const el = ref.current!;
    let released = false;
    const measure = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : {w, h}));
      if (w > 0 && h > 0 && !released) {
        released = true;
        continueRender(handle);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (!released) continueRender(handle);
    };
  }, [handle]);

  // Gradients/images can't be an SVG fill, so the background is clipped to the path instead.
  // The clipped layer is padded so the outward waves have room.
  const pad = Math.ceil(options.amplitude * 2);
  return (
    <div ref={ref} style={{position: 'absolute', inset: 0, ...style}}>
      {size && size.w > 0 && size.h > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: -pad,
            background,
            clipPath: `path('${blobPath(size.w, size.h, options, pad)}')`,
          }}
        />
      )}
    </div>
  );
};
