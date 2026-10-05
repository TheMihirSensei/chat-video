import React, {useCallback, useEffect, useRef, useState} from 'react';
import type {PlayerRef} from '@remotion/player';
import type {LessonSlide} from '../../src/lesson/types';
import {api, type LessonSummary} from './api';
import {Preview, usePreviewData} from './components/Preview';
import {RenderPanel} from './components/RenderPanel';
import {SettingsPanel} from './components/SettingsPanel';
import {SlideCard} from './components/SlideCard';
import {findIssues, newLesson, newSlide, normalizeLesson, type Lesson} from './model';

const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,60}$/i;

export const App: React.FC = () => {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [name, setName] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<{text: string; error?: boolean} | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const player = useRef<PlayerRef>(null);
  const preview = usePreviewData(lesson);

  const flash = (text: string, error = false) => {
    setStatus({text, error});
    if (!error) window.setTimeout(() => setStatus((s) => (s?.text === text ? null : s)), 2500);
  };

  const refreshList = useCallback(() => api.listLessons().then(setLessons), []);

  const open = useCallback(async (target: string) => {
    try {
      const raw = await api.getLesson(target);
      setLesson(normalizeLesson(raw));
      setName(target);
      setDirty(false);
      setStatus(null);
      window.history.replaceState(null, '', `?lesson=${encodeURIComponent(target)}`);
    } catch (err) {
      flash((err as Error).message, true);
    }
  }, []);

  // Load the lesson list, then open the lesson from the URL (or the first one).
  useEffect(() => {
    api.listLessons().then((list) => {
      setLessons(list);
      const fromUrl = new URLSearchParams(window.location.search).get('lesson');
      const first = list.find((l) => l.name === fromUrl)?.name ?? list[0]?.name;
      if (first) open(first);
      else setCreating(true);
    });
  }, [open]);

  const update = (next: Lesson) => {
    setLesson(next);
    setDirty(true);
  };
  const updateSlides = (fn: (slides: LessonSlide[]) => LessonSlide[]) => lesson && update({...lesson, slides: fn(lesson.slides)});

  const save = useCallback(async (): Promise<boolean> => {
    if (!lesson || !name) return false;
    try {
      await api.saveLesson(name, lesson);
      setDirty(false);
      flash('Saved');
      refreshList();
      return true;
    } catch (err) {
      flash((err as Error).message, true);
      return false;
    }
  }, [lesson, name, refreshList]);

  // Ctrl/Cmd+S saves; warn before leaving with unsaved changes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onLeave);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeunload', onLeave);
    };
  }, [save, dirty]);

  const switchTo = (target: string) => {
    if (target === name) return;
    if (dirty && !window.confirm('You have unsaved changes. Switch lessons and lose them?')) return;
    open(target);
  };

  const create = async () => {
    const target = newName.trim();
    if (!NAME_RE.test(target)) return flash('Name: letters, numbers, - and _ only (e.g. lesson3)', true);
    if (lessons.some((l) => l.name === target)) return flash(`"${target}" already exists`, true);
    if (dirty && !window.confirm('You have unsaved changes. Create a new lesson and lose them?')) return;
    const fresh = newLesson();
    try {
      await api.saveLesson(target, fresh);
      await refreshList();
      setCreating(false);
      setNewName('');
      open(target);
    } catch (err) {
      flash((err as Error).message, true);
    }
  };

  const previewSlide = (index: number) => {
    const start = preview.timeline?.slides[index]?.start;
    if (start === undefined || !player.current) return;
    player.current.seekTo(start);
    player.current.play();
  };

  const issues = lesson ? findIssues(lesson) : [];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">文</span>
          <span>Lesson Studio</span>
        </div>

        <div className="topbar__lesson">
          <select className="input" value={name ?? ''} onChange={(e) => switchTo(e.target.value)} disabled={!lessons.length}>
            {!name && <option value="">Choose a lesson…</option>}
            {lessons.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name} ({l.slides} slide{l.slides === 1 ? '' : 's'})
              </option>
            ))}
          </select>
          {creating ? (
            <form
              className="new-lesson"
              onSubmit={(e) => {
                e.preventDefault();
                create();
              }}
            >
              <input className="input" autoFocus placeholder="lesson3" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <button className="btn btn--primary" type="submit">Create</button>
              {lessons.length > 0 && (
                <button className="btn btn--ghost" type="button" onClick={() => setCreating(false)}>Cancel</button>
              )}
            </form>
          ) : (
            <button className="btn" type="button" onClick={() => setCreating(true)}>+ New lesson</button>
          )}
        </div>

        <div className="topbar__actions">
          {status && <span className={`status ${status.error ? 'status--error' : ''}`}>{status.text}</span>}
          {dirty && !status && <span className="status status--dirty">Unsaved changes</span>}
          <button className="btn btn--primary" type="button" onClick={save} disabled={!lesson || !dirty}>
            Save
          </button>
        </div>
      </header>

      {lesson && name ? (
        <main className="workspace">
          <div className="editor">
            <SettingsPanel lesson={lesson} onChange={update} />

            {lesson.slides.map((slide, i) => (
              <SlideCard
                key={i}
                index={i}
                count={lesson.slides.length}
                slide={slide}
                issues={issues.filter((x) => x.slide === i)}
                onChange={(s) => updateSlides((all) => all.map((x, j) => (j === i ? s : x)))}
                onMove={(delta) =>
                  updateSlides((all) => {
                    const next = [...all];
                    [next[i], next[i + delta]] = [next[i + delta], next[i]];
                    return next;
                  })
                }
                onDuplicate={() =>
                  updateSlides((all) => [...all.slice(0, i + 1), structuredClone(slide), ...all.slice(i + 1)])
                }
                onDelete={() => updateSlides((all) => all.filter((_, j) => j !== i))}
                onPreview={() => previewSlide(i)}
              />
            ))}

            <button
              type="button"
              className="btn btn--dashed btn--block"
              onClick={() => {
                updateSlides((all) => [...all, newSlide(all[all.length - 1])]);
                window.setTimeout(() => document.getElementById(`slide-${lesson.slides.length}`)?.scrollIntoView({behavior: 'smooth'}), 50);
              }}
            >
              + Add slide
            </button>
          </div>

          <aside className="sidebar">
            <Preview ref={player} data={preview} />
            <RenderPanel name={name} canRender={issues.length === 0} beforeRender={save} />
          </aside>
        </main>
      ) : (
        <main className="empty">
          <h1>Lesson Studio</h1>
          <p>Create a lesson to get started. Each slide is a question and its answer, with a GIF, Japanese and English text, and audio.</p>
        </main>
      )}
    </div>
  );
};
