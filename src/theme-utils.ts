import type {Format} from './types';

// Helpers shared by every theme type. Kept free of bundler-specific code so the
// lesson editor (Vite) can import them too.

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const deepMerge = <T>(base: T, override: unknown): T => {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override === undefined ? base : override) as T;
  }
  const out: Record<string, unknown> = {...base};
  for (const [key, value] of Object.entries(override)) {
    out[key] = key in out ? deepMerge(out[key], value) : value;
  }
  return out as T;
};

export const FORMAT_SIZES: Record<Format, {width: number; height: number}> = {
  vertical: {width: 1080, height: 1920},
  horizontal: {width: 1920, height: 1080},
};
