import React from 'react';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {Composition, type CalculateMetadataFunction} from 'remotion';
import sampleChat from '../chats/chat1.json';
import sampleLesson from '../lessons/lesson1.json';
import {resolveSrc} from './assets';
import {ChatVideo} from './ChatVideo';
import {LessonVideo} from './lesson/LessonVideo';
import {getLessonVideoSize, resolveLessonTheme} from './lesson/theme';
import {computeLessonTimeline} from './lesson/timing';
import type {LessonProps} from './lesson/types';
import samplePhrases from '../phrases/phrase1.json';
import {PhraseVideo} from './phrase/PhraseVideo';
import {getPhraseVideoSize, resolvePhraseTheme} from './phrase/theme';
import {computePhraseTimeline} from './phrase/timing';
import type {PhraseProps} from './phrase/types';
import {getVideoSize, resolveTheme} from './theme';
import {computeTimeline} from './timing';
import type {ChatProps} from './types';

const calculateMetadata: CalculateMetadataFunction<ChatProps> = ({props}) => {
  const theme = resolveTheme(props.theme);
  const fps = theme.video.fps;
  return {
    fps,
    durationInFrames: computeTimeline(props.messages, theme, fps).durationInFrames,
    ...getVideoSize(theme, props.format),
  };
};

/** Reads voice clip lengths up front, since lines/slides last as long as their audio. */
const readAudioDurations = (items: {audio?: string}[]) =>
  Promise.all(
    items.map((item) =>
      item.audio
        ? getAudioDurationInSeconds(resolveSrc(item.audio)).catch((err) => {
            throw new Error(`Could not read audio "${item.audio}" (is it in public/?): ${err.message}`);
          })
        : null,
    ),
  );

const calculateLessonMetadata: CalculateMetadataFunction<LessonProps> = async ({props}) => {
  const theme = resolveLessonTheme(props.theme);
  const fps = theme.video.fps;
  const audioDurations = await readAudioDurations(props.lines);
  return {
    fps,
    durationInFrames: computeLessonTimeline(props.lines, audioDurations, theme, fps).durationInFrames,
    ...getLessonVideoSize(theme, props.format),
    props: {...props, audioDurations},
  };
};

const calculatePhraseMetadata: CalculateMetadataFunction<PhraseProps> = async ({props}) => {
  const theme = resolvePhraseTheme(props.theme);
  const fps = theme.video.fps;
  const audioDurations = await readAudioDurations(props.slides);
  return {
    fps,
    durationInFrames: computePhraseTimeline(props.slides, audioDurations, theme, fps).durationInFrames,
    ...getPhraseVideoSize(theme, props.format),
    props: {...props, audioDurations},
  };
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ChatVideo"
      component={ChatVideo}
      defaultProps={{theme: 'default', ...(sampleChat as ChatProps)}}
      calculateMetadata={calculateMetadata}
      // Real values come from calculateMetadata.
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="LessonVideo"
      component={LessonVideo}
      defaultProps={{theme: 'default', ...(sampleLesson as LessonProps)}}
      calculateMetadata={calculateLessonMetadata}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="PhraseVideo"
      component={PhraseVideo}
      defaultProps={{theme: 'default', ...(samplePhrases as PhraseProps)}}
      calculateMetadata={calculatePhraseMetadata}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
