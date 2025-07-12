import { Composition } from 'remotion';

import { NameVideo } from './compositions/NameVideo';
import { Lullaby } from './compositions/Lullaby';
import { LetterHunt } from './compositions/LetterHunt';
import { HelloWorld } from './compositions/HelloWorld';
import { HelloWorldWithImage } from './compositions/HelloWorldWithImage';
import { HelloWorldWithImageAndAudio } from './compositions/HelloWorldWithImageAndAudio';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Name Video Composition - MAIN PRODUCTION VERSION */}
      <Composition
        id="NameVideo"
        component={NameVideo}
        durationInFrames={900} // Fallback for up to 8-letter names (30 segments * 30fps)
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Liam',
          childAge: 2,
          childTheme: 'dinosaurs',
          backgroundMusicUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752096424386.mp3',
          backgroundMusicVolume: 0.25,
          introImageUrl: '',
          outroImageUrl: '',
          letterImageUrls: [],
          introAudioUrl: '',
          outroAudioUrl: '',
          audioAssets: {
            fullName: '', // Will be populated by API
            letters: {}   // Will be populated by API
          },
          letterAudioUrls: {}, // Support old structure as fallback
          debugMode: true, // Enable for troubleshooting audio timing
        }}
        calculateMetadata={({ props }) => {
          const nameLength = props.childName?.length || 4;
          const totalSegments = nameLength + 2; // intro + letters + outro
          const segmentDuration = 30 * 4; // 4 seconds per segment at 30fps
          const calculatedDuration = totalSegments * segmentDuration;
          
          console.log(`🎬 Dynamic duration calculation for "${props.childName}":`, {
            nameLength,
            totalSegments,
            segmentDurationFrames: segmentDuration,
            segmentDurationSeconds: 4,
            totalDurationFrames: calculatedDuration,
            totalDurationSeconds: calculatedDuration / 30,
            fps: 30
          });
          
          return {
            durationInFrames: calculatedDuration,
          };
        }}
      />

      {/* Name Video Composition - Nolan (5 letters) */}
      <Composition
        id="NameVideo-Nolan"
        component={NameVideo}
        durationInFrames={840} // 7 segments * 4 seconds * 30fps = 840 frames
        fps={30} // Changed to match main composition
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Nolan',
          childTheme: 'halloween',
          childAge: 3,
          backgroundMusicUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1751989180199.wav',
          backgroundMusicVolume: 0.25, // Reduced to match main
          introImageUrl: '',
          outroImageUrl: '',
          letterImageUrls: [],
          introAudioUrl: '',
          outroAudioUrl: '',
          audioAssets: {
            fullName: '',
            letters: {}
          },
          letterAudioUrls: {},
          debugMode: true
        }}
      />

      {/* Name Video Composition - Lorelei (7 letters) */}
      <Composition
        id="NameVideo-Lorelei"
        component={NameVideo}
        durationInFrames={1080} // 9 segments * 4 seconds * 30fps = 1080 frames
        fps={30} // Changed to match main composition
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Lorelei',
          childTheme: 'halloween',
          childAge: 3,
          backgroundMusicUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1751989180199.wav',
          backgroundMusicVolume: 0.25, // Reduced to match main
          introImageUrl: '',
          outroImageUrl: '',
          letterImageUrls: [],
          introAudioUrl: '',
          outroAudioUrl: '',
          audioAssets: {
            fullName: '',
            letters: {}
          },
          letterAudioUrls: {},
          debugMode: true
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
          childName: 'Emma',
          childAge: 4,
          childTheme: 'space',
          backgroundMusicUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1751989180199.wav',
          backgroundMusicVolume: 0.8,
          duration: 108, // DreamDrip audio duration (hardcoded for local preview)
          introImageUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
          outroImageUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
          slideshowImageUrls: [
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
          ],
          introAudioUrl: '', // Personalized audio for intro (empty for now)
          debugMode: true, // Enable debug mode to see what's missing
        }}
      />

      {/* Letter Hunt Composition - NEW TEMPLATE */}
      <Composition
        id="LetterHunt"
        component={LetterHunt}
        durationInFrames={795} // 26.5 seconds at 30fps (7 segments * 3 seconds + 1 intro segment * 5.5 seconds)
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Nolan',
          targetLetter: 'N',
          childTheme: 'monsters',
          childAge: 3,
          assets: {
            titleCard: { url: '', status: 'missing' as const },
            introVideo: { url: '', status: 'missing' as const },
            intro2Video: { url: '', status: 'missing' as const },
            intro3Video: { url: '', status: 'missing' as const },
            signImage: { url: '', status: 'missing' as const },
            bookImage: { url: '', status: 'missing' as const },
            groceryImage: { url: '', status: 'missing' as const },
            happyDanceVideo: { url: '', status: 'missing' as const },
            endingImage: { url: '', status: 'missing' as const },
            titleAudio: { url: '', status: 'missing' as const },
            introAudio: { url: '', status: 'missing' as const },
            intro2Audio: { url: '', status: 'missing' as const },
            intro3Audio: { url: '', status: 'missing' as const },
            signAudio: { url: '', status: 'missing' as const },
            bookAudio: { url: '', status: 'missing' as const },
            groceryAudio: { url: '', status: 'missing' as const },
            happyDanceAudio: { url: '', status: 'missing' as const },
            endingAudio: { url: '', status: 'missing' as const },
            backgroundMusic: { 
              url: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752340926893.MP3', 
              status: 'ready' as const 
            }
          }
        }}
        calculateMetadata={({ props }) => {
          // 9 segments total: 8 standard segments * 3 seconds + 1 extended intro segment * 5.5 seconds = 29.5 seconds
          // Segments: titleCard(3s), intro(5.5s), intro2(3s), intro3(3s), sign(3s), book(3s), grocery(3s), happyDance(3s), ending(3s)
          const standardSegmentDuration = 3;
          const extendedIntroSegmentDuration = 5.5;
          const standardSegments = 8; // titleCard, intro2, intro3, sign, book, grocery, happyDance, ending
          const totalDurationFrames = (standardSegments * standardSegmentDuration + extendedIntroSegmentDuration) * 30; // 885 frames
          
          console.log(`🎬 Letter Hunt duration calculation for "${props.childName}" (Letter ${props.targetLetter}):`, {
            totalSegments: 9,
            standardSegments,
            standardSegmentDurationSeconds: standardSegmentDuration,
            extendedIntroSegmentDurationSeconds: extendedIntroSegmentDuration,
            totalDurationSeconds: 29.5,
            totalDurationFrames,
            fps: 30
          });
          
          return {
            durationInFrames: totalDurationFrames,
          };
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

      {/* Hello World with Image and Audio Composition */}
      <Composition
        id="HelloWorldWithImageAndAudio"
        component={HelloWorldWithImageAndAudio}
        durationInFrames={1800} // 30 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          backgroundImageUrl: 'https://picsum.photos/1920/1080',
          backgroundMusicUrl: '',
          backgroundMusicVolume: 0.25,
          letterAudioUrl: '',
          letterName: ''
        }}
      />

    </>
  );
};
