import React from 'react';
import type {LessonLine} from '../../../src/lesson/types';
import {FileField, GifField} from './FileField';

const numberOrUndefined = (value: string) => (value === '' ? undefined : Number(value));

/** One card on a slide (the question or the answer). */
export const LineEditor: React.FC<{
  role: string;
  line: LessonLine;
  onChange: (line: LessonLine) => void;
  onRemove?: () => void;
}> = ({role, line, onChange, onRemove}) => {
  const set = <K extends keyof LessonLine>(key: K, value: LessonLine[K]) => {
    const next = {...line};
    if (value === undefined || value === '') delete next[key];
    else next[key] = value;
    onChange(next);
  };
  const side = line.side ?? 'right';

  return (
    <div className="line">
      <div className="line__head">
        <span className={`role role--${role.toLowerCase()}`}>{role}</span>
        <div className="segmented" role="group" aria-label="GIF side">
          {(['left', 'right'] as const).map((s) => (
            <button key={s} type="button" className={side === s ? 'is-active' : ''} onClick={() => set('side', s)}>
              GIF {s}
            </button>
          ))}
        </div>
        {onRemove && (
          <button type="button" className="btn btn--small btn--ghost" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>

      <div className="line__body">
        <GifField value={line.image} onChange={(v) => set('image', v)} />

        <div className="line__fields">
          <div className="lang lang--en">
            <label className="field">
              <span className="field__label">English text</span>
              <input
                className="input"
                value={line.translation ?? ''}
                placeholder="Good morning"
                onChange={(e) => set('translation', e.target.value)}
              />
            </label>
            <div className="field">
              <span className="field__label">English audio</span>
              <FileField kind="audio" value={line.translationAudio} onChange={(v) => set('translationAudio', v)} label="English audio" />
            </div>
          </div>

          <div className="lang lang--ja">
            <label className="field">
              <span className="field__label">Japanese text</span>
              <input
                className="input input--ja"
                value={line.text ?? ''}
                placeholder="おはよう"
                onChange={(e) => set('text', e.target.value)}
              />
            </label>
            <div className="field">
              <span className="field__label">Japanese audio</span>
              <FileField kind="audio" value={line.audio} onChange={(v) => set('audio', v)} label="Japanese audio" />
            </div>
          </div>

          <details className="advanced">
            <summary>GIF size &amp; position</summary>
            <div className="advanced__grid">
              <label className="field">
                <span className="field__label">Height (px)</span>
                <input className="input" type="number" min={50} step={10} placeholder="340"
                  value={line.height ?? ''} onChange={(e) => set('height', numberOrUndefined(e.target.value))} />
              </label>
              <label className="field">
                <span className="field__label">Move out / in</span>
                <input className="input" type="number" step={5} placeholder="80"
                  value={line.offsetX ?? ''} onChange={(e) => set('offsetX', numberOrUndefined(e.target.value))} />
              </label>
              <label className="field">
                <span className="field__label">Move down / up</span>
                <input className="input" type="number" step={5} placeholder="0"
                  value={line.offsetY ?? ''} onChange={(e) => set('offsetY', numberOrUndefined(e.target.value))} />
              </label>
              <label className="field field--check">
                <input type="checkbox" checked={Boolean(line.flip)} onChange={(e) => set('flip', e.target.checked || undefined)} />
                <span>Mirror</span>
              </label>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};
