import {forwardRef, useEffect, useMemo, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import {LessonVideo} from '../../../src/lesson/LessonVideo';
import {getLessonVideoSize, resolveLessonTheme} from '../../../src/lesson/theme';
import {computeLessonTimeline, getLessonSlides, type LessonTimeline} from '../../../src/lesson/timing';
import type {LessonProps} from '../../../src/lesson/types';
import {api} from '../api';
import {describeIssue, findIssues, type Lesson} from '../model';


export type PreviewData = {
  ready: boolean;
  issues: string[];
  props: LessonProps | null;
  timeline: LessonTimeline | null;
  fps: number;
  width: number;
  height: number;
  missingAudio: string[];
};

/** Everything the player needs: resolved theme, audio lengths and the timeline (same maths as rendering). */
export const usePreviewData = (lesson: Lesson | null): PreviewData => {
  const [durations, setDurations] = useState<Record<string, number | null>>({});
  const audioPaths = useMemo(
    () =>
      lesson
        ? [...new Set(lesson.slides.flatMap((s) => s.lines.flatMap((l) => [l.audio, l.translationAudio])).filter(Boolean) as string[])]
        : [],
    [lesson],
  );

  // Ask the server for any audio lengths we don't know yet (same ffprobe the renderer relies on).
  useEffect(() => {
    const unknown = audioPaths.filter((p) => !(p in durations));
    if (!unknown.length) return;
    let alive = true;
    api
      .audioDurations(unknown)
      .catch(() => Object.fromEntries(unknown.map((p) => [p, null])))
      .then((found) => alive && setDurations((prev) => ({...prev, ...found})));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioPaths]);

  return useMemo(() => {
    const empty = {ready: false, props: null, timeline: null, fps: 30, width: 1920, height: 1080, missingAudio: []};
    if (!lesson) return {...empty, issues: []};
    const issues = findIssues(lesson).map(describeIssue);
    let theme;
    try {
      theme = resolveLessonTheme(lesson.theme);
    } catch (err) {
      return {...empty, issues: [(err as Error).message]};
    }
    const size = getLessonVideoSize(theme, lesson.format);
    const loading = audioPaths.some((p) => !(p in durations));
    const missingAudio = audioPaths.filter((p) => durations[p] === null);
    const slides = getLessonSlides(lesson, theme);
    const lines = slides.flatMap((s) => s.lines);
    const props: LessonProps = {
      ...lesson,
      audioDurations: lines.map((l) => (l.audio ? durations[l.audio] ?? null : null)),
      translationAudioDurations: lines.map((l) => (l.translationAudio ? durations[l.translationAudio] ?? null : null)),
    };
    const timeline = computeLessonTimeline(slides, props.audioDurations, props.translationAudioDurations, theme, theme.video.fps);
    return {
      ready: !loading && issues.length === 0,
      issues,
      props,
      timeline,
      fps: theme.video.fps,
      width: size.width,
      height: size.height,
      missingAudio,
    };
  }, [lesson, durations, audioPaths]);
};

// Optional ?frame=123 in the URL opens the preview at that frame.
const initialFrame = Math.max(0, Number(new URLSearchParams(window.location.search).get('frame')) || 0);

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;

export const Preview = forwardRef<PlayerRef, {data: PreviewData}>(({data}, ref) => {
  const {ready, issues, props, timeline, fps, width, height, missingAudio} = data;
  return (
    <div className="preview">
      <div className="preview__frame" style={{aspectRatio: `${width} / ${height}`}}>
        {ready && props && timeline ? (
          <Player
            ref={ref}
            component={LessonVideo}
            inputProps={props}
            durationInFrames={timeline.durationInFrames}
            fps={fps}
            compositionWidth={width}
            compositionHeight={height}
            controls
            clickToPlay
            initialFrame={Math.min(initialFrame, timeline.durationInFrames - 1)}
            acknowledgeRemotionLicense
            style={{width: '100%', height: '100%'}}
            errorFallback={({error}) => <div className="preview__message">Preview error: {error.message}</div>}
          />
        ) : (
          <div className="preview__message">
            {issues.length ? (
              <>
                <strong>Finish these to see the preview:</strong>
                <ul>
                  {issues.slice(0, 8).map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                  {issues.length > 8 && <li>…and {issues.length - 8} more</li>}
                </ul>
              </>
            ) : (
              'Loading audio…'
            )}
          </div>
        )}
      </div>
      {timeline && (
        <div className="preview__meta">
          {timeline.slides.length} slide{timeline.slides.length === 1 ? '' : 's'} · {formatTime(timeline.durationInFrames / fps)} long
        </div>
      )}
      {missingAudio.length > 0 && (
        <div className="field-error">Couldn't read: {missingAudio.join(', ')}</div>
      )}
    </div>
  );
});
