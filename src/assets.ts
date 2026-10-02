import {getStaticFiles, staticFile} from 'remotion';

const isUrl = (src: string) => /^(https?:|data:)/.test(src);

/** Resolves a path inside public/ (or a URL) to something <Img>/<Audio> can load. */
export const resolveSrc = (src: string) => (isUrl(src) ? src : staticFile(src.replace(/^\/+/, '')));

/** Finds an avatar in public/avatars/ or public/. Returns null if the file doesn't exist. */
export const resolveAvatar = (avatar: string | null | undefined): string | null => {
  if (!avatar) return null;
  if (isUrl(avatar)) return avatar;
  const names = new Set(getStaticFiles().map((f) => f.name));
  const candidate = [`avatars/${avatar}`, avatar].find((p) => names.has(p));
  return candidate ? staticFile(candidate) : null;
};
