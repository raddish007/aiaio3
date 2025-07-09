import { Composition } from 'remotion';
import { NameVideo } from './compositions/NameVideo';
import { BedtimeSong } from './compositions/BedtimeSong';
import { LetterHunt } from './compositions/LetterHunt';
import { EpisodeSegment } from './compositions/EpisodeSegment';
import { LullabyFresh } from './compositions/LullabyFresh';
import { Lullaby } from './compositions/Lullaby';
import { TemplateVideo } from './compositions/TemplateVideo';
import { SimpleTemplate } from './compositions/SimpleTemplate';
import { UniversalTemplate } from './compositions/UniversalTemplate';
import { HelloWorld } from './compositions/HelloWorld';
import { HelloWorldWithImage } from './compositions/HelloWorldWithImage';

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

      {/* Lullaby Fresh Composition */}
      <Composition
        id="LullabyFresh"
        component={LullabyFresh}
        durationInFrames={6390} // 1:46.5 at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Nolan',
          introAudioUrl: '',
          outroAudioUrl: '',
          lullabySongUrl: '',
          lullabySongVolume: 0.8,
          introImage: '',
          outroImage: '',
          slideshowImages: [],
          debugMode: true, // Enable debug mode to see what's missing
        }}
      />

      {/* Lullaby Composition */}
      <Composition
        id="Lullaby"
        component={Lullaby}
        durationInFrames={6480} // 108 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Nolan',
          childAge: 3,
          childTheme: 'halloween',
          backgroundMusicUrl: '',
          backgroundMusicVolume: 0.8,
          duration: 108, // DreamDrip audio duration (hardcoded for local preview)
          introImageUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
          outroImageUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
          introAudioUrl: '', // Personalized audio for intro (empty for now)
          debugMode: true, // Enable debug mode to see what's missing
        }}
      />

      {/* Lullaby Christopher Composition - Test longer name */}
      <Composition
        id="Lullaby-Christopher"
        component={Lullaby}
        durationInFrames={6480} // 108 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Christopher',
          childAge: 5,
          childTheme: 'space',
          backgroundMusicUrl: '',
          backgroundMusicVolume: 0.8,
          duration: 108, // DreamDrip audio duration (hardcoded for local preview)
          introImageUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
          outroImageUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
          introAudioUrl: '', // Personalized audio for intro (empty for now)
          debugMode: true, // Enable debug mode to see what's missing
        }}
      />

      {/* Hello World Composition */}
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={180} // 3 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
      />

      {/* Hello World with Image Composition */}
      <Composition
        id="HelloWorldWithImage"
        component={HelloWorldWithImage}
        durationInFrames={180} // 3 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          backgroundImageUrl: 'https://picsum.photos/1920/1080'
        }}
      />
    </>
  );
}; 