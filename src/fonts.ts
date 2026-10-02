import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import type {Theme} from './theme';

const FONT_TIMEOUT_MS = 20000;

const addStylesheet = (href: string) =>
  new Promise<void>((resolve) => {
    const existing = document.querySelector<HTMLLinkElement>(`link[href="${href}"]`);
    if (existing) return resolve();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => {
      console.warn(`Could not load font stylesheet ${href}`);
      resolve();
    };
    document.head.appendChild(link);
  });

const googleFontUrl = (family: string, weights: number[]) => {
  const name = family.trim().replace(/ /g, '+');
  const w = weights.length ? `:wght@${[...weights].sort((a, b) => a - b).join(';')}` : '';
  return `https://fonts.googleapis.com/css2?family=${name}${w}&display=block`;
};

const loadFonts = async (theme: Theme, sampleText: string) => {
  const {family, source, file, weights, emojiFont} = theme.font;
  if (source === 'google') {
    await addStylesheet(googleFontUrl(family, weights));
  } else if (source === 'local' && file) {
    const face = new FontFace(family, `url(${staticFile(file)})`);
    document.fonts.add(await face.load());
  }
  if (emojiFont) await addStylesheet(googleFontUrl(emojiFont, []));
  const {titleFont, titleWeight} = theme.header;
  if (titleFont) await addStylesheet(googleFontUrl(titleFont, [titleWeight]));

  // Force-load every glyph we will draw so nothing pops in mid-render.
  const loads = (weights.length ? weights : [400]).map((w) => document.fonts.load(`${w} 40px "${family}"`, sampleText));
  if (emojiFont) loads.push(document.fonts.load(`40px "${emojiFont}"`, sampleText));
  if (titleFont) loads.push(document.fonts.load(`${titleWeight} 40px "${titleFont}"`, sampleText));
  await Promise.all(loads);
  await document.fonts.ready;
};

export const fontStack = (theme: Theme) =>
  [`"${theme.font.family}"`, theme.font.emojiFont && `"${theme.font.emojiFont}"`, 'system-ui', 'sans-serif']
    .filter(Boolean)
    .join(', ');

/** Loads the theme fonts and holds the render until they're ready. */
export const useFonts = (theme: Theme, sampleText: string) => {
  const [handle] = useState(() => delayRender('Loading fonts', {timeoutInMilliseconds: FONT_TIMEOUT_MS + 10000}));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setReady(true);
      continueRender(handle);
    };
    const timer = setTimeout(() => {
      console.warn('Font loading timed out, continuing with fallback fonts');
      finish();
    }, FONT_TIMEOUT_MS);
    loadFonts(theme, sampleText)
      .catch((err) => {
        if (theme.font.source === 'local') cancelRender(err);
        console.warn('Font loading failed, continuing with fallback fonts', err);
      })
      .finally(() => {
        clearTimeout(timer);
        finish();
      });
    // Fonts are loaded once per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  return ready;
};

export type FontSpec = {family: string; weights: number[]};

/** Loads a list of Google Fonts and holds the render until they're ready. */
export const useGoogleFonts = (fonts: FontSpec[], sampleText: string) => {
  const [handle] = useState(() => delayRender('Loading fonts', {timeoutInMilliseconds: FONT_TIMEOUT_MS + 10000}));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setReady(true);
      continueRender(handle);
    };
    const timer = setTimeout(finish, FONT_TIMEOUT_MS);
    Promise.all(
      fonts.map(async ({family, weights}) => {
        await addStylesheet(googleFontUrl(family, weights));
        await Promise.all((weights.length ? weights : [400]).map((w) => document.fonts.load(`${w} 40px "${family}"`, sampleText)));
      }),
    )
      .then(() => document.fonts.ready)
      .catch((err) => console.warn('Font loading failed, continuing with fallback fonts', err))
      .finally(() => {
        clearTimeout(timer);
        finish();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  return ready;
};
