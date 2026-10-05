import React, {useEffect, useRef, useState} from 'react';
import {api, type RenderJob} from '../api';

const STAGE: Record<RenderJob['status'], string> = {
  bundling: 'Preparing…',
  rendering: 'Rendering',
  done: 'Done',
  error: 'Failed',
};

/** Save → render to out/lessons/<name>.mp4 → watch / download the result. */
export const RenderPanel: React.FC<{
  name: string;
  canRender: boolean;
  beforeRender: () => Promise<boolean>;
}> = ({name, canRender, beforeRender}) => {
  const [job, setJob] = useState<RenderJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoVersion, setVideoVersion] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  // Show the existing video for this lesson, if it has been rendered before.
  useEffect(() => {
    setJob(null);
    setError(null);
    api.videoStatus(name).then((s) => setVideoVersion(s.exists ? s.updated ?? Date.now() : null)).catch(() => setVideoVersion(null));
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [name]);

  const poll = (id: string) => {
    timer.current = window.setTimeout(async () => {
      try {
        const next = await api.getRender(id);
        setJob(next);
        if (next.status === 'done') setVideoVersion(Date.now());
        else if (next.status !== 'error') poll(id);
      } catch (err) {
        setError((err as Error).message);
      }
    }, 1000);
  };

  const start = async () => {
    setError(null);
    if (!(await beforeRender())) return;
    try {
      const started = await api.startRender(name);
      setJob(started);
      poll(started.id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const running = job && (job.status === 'bundling' || job.status === 'rendering');
  const pct = job ? Math.round(job.progress * 100) : 0;

  return (
    <section className="panel render">
      <div className="render__head">
        <h3>Video</h3>
        <button type="button" className="btn btn--primary" onClick={start} disabled={!canRender || Boolean(running)}>
          {running ? 'Rendering…' : 'Save & render MP4'}
        </button>
      </div>

      {running && (
        <div className="progress">
          <div className="progress__bar" style={{width: `${job!.status === 'bundling' ? 3 : Math.max(3, pct)}%`}} />
          <span className="progress__label">
            {STAGE[job!.status]} {job!.status === 'rendering' ? `${pct}%` : ''}
          </span>
        </div>
      )}
      {job?.status === 'error' && <div className="field-error">Render failed: {job.error}</div>}
      {error && <div className="field-error">{error}</div>}
      {!canRender && <div className="hint">Fix the items listed in the preview to enable rendering.</div>}

      {videoVersion && !running && (
        <div className="render__result">
          <video key={videoVersion} controls preload="metadata" src={`/api/videos/${name}.mp4?v=${videoVersion}`} />
          <a className="btn" href={`/api/videos/${name}.mp4?download=1&v=${videoVersion}`}>
            ⬇ Download {name}.mp4
          </a>
          <span className="hint">Saved at out/lessons/{name}.mp4</span>
        </div>
      )}
    </section>
  );
};
