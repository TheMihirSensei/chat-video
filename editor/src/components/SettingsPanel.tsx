import React from 'react';
import {applySettings, getSettings, type Lesson, type LessonSettings} from '../model';

/** Lesson-wide audio and timing settings (saved into the lesson file as a theme override). */
export const SettingsPanel: React.FC<{lesson: Lesson; onChange: (lesson: Lesson) => void}> = ({lesson, onChange}) => {
  let settings: LessonSettings;
  try {
    settings = getSettings(lesson);
  } catch {
    return null;
  }
  const update = (patch: Partial<LessonSettings>) => onChange(applySettings(lesson, {...settings, ...patch}));
  const count = (value: string) => Math.max(0, Math.min(10, Math.round(Number(value) || 0)));

  return (
    <section className="panel settings">
      <h3>Audio settings</h3>
      <div className="settings__grid">
        <label className="field">
          <span className="field__label">Plays first</span>
          <select className="input" value={settings.order} onChange={(e) => update({order: e.target.value as LessonSettings['order']})}>
            <option value="english-first">English</option>
            <option value="japanese-first">Japanese</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">English plays</span>
          <input className="input" type="number" min={0} max={10} value={settings.englishRepeat}
            onChange={(e) => update({englishRepeat: count(e.target.value)})} />
        </label>
        <label className="field">
          <span className="field__label">Japanese plays</span>
          <input className="input" type="number" min={0} max={10} value={settings.japaneseRepeat}
            onChange={(e) => update({japaneseRepeat: count(e.target.value)})} />
        </label>
        <label className="field">
          <span className="field__label">Pause before answer (s)</span>
          <input className="input" type="number" min={0} max={20} step={0.5} value={settings.answerDelay}
            onChange={(e) => update({answerDelay: Math.max(0, Number(e.target.value) || 0)})} />
        </label>
      </div>
    </section>
  );
};
