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

const calculateLessonMetadata: CalculateMetadataFunction<LessonProps> = async ({props}) => {
  const theme = resolveLessonTheme(props.theme);
  const fps = theme.video.fps;
  // Each line lasts as long as its voice clip, so read the audio lengths up front.
  const audioDurations = await Promise.all(
    props.lines.map((line) =>
      line.audio
        ? getAudioDurationInSeconds(resolveSrc(line.audio)).catch((err) => {
            throw new Error(`Could not read audio "${line.audio}" (is it in public/?): ${err.message}`);
          })
        : null,
    ),
  );
  return {
    fps,
    durationInFrames: computeLessonTimeline(props.lines, audioDurations, theme, fps).durationInFrames,
    ...getLessonVideoSize(theme, props.format),
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
  </>
);
