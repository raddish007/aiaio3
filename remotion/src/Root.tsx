import { Composition } from 'remotion';
import { NameVideo } from './compositions/NameVideo';
import { BedtimeSong } from './compositions/BedtimeSong';
import { LetterHunt } from './compositions/LetterHunt';
import { EpisodeSegment } from './compositions/EpisodeSegment';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Name Video Composition */}
      <Composition
        id="NameVideo"
        component={NameVideo}
        durationInFrames={240} // 4 minutes at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Nolan',
          theme: 'halloween',
          age: 3,
        }}
      />

      {/* Bedtime Song Composition */}
      <Composition
        id="BedtimeSong"
        component={BedtimeSong}
        durationInFrames={180} // 3 minutes at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Nolan',
          theme: 'halloween',
          age: 3,
        }}
      />

      {/* Letter Hunt Composition */}
      <Composition
        id="LetterHunt"
        component={LetterHunt}
        durationInFrames={120} // 2 minutes at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Nolan',
          letter: 'N',
          theme: 'halloween',
          age: 3,
        }}
      />

      {/* Episode Segment Composition */}
      <Composition
        id="EpisodeSegment"
        component={EpisodeSegment}
        durationInFrames={300} // 5 minutes at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Nolan',
          segmentType: 'personalized',
          theme: 'halloween',
          age: 3,
          segmentTitle: 'Nolan\'s Dance Time',
        }}
      />
    </>
  );
}; 