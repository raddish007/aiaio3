import { Composition } from 'remotion';

import { NameVideo } from './compositions/NameVideo';
import { Lullaby } from './compositions/Lullaby';
import { HelloWorld } from './compositions/HelloWorld';
import { HelloWorldWithImage } from './compositions/HelloWorldWithImage';
import { HelloWorldWithImageAndAudio } from './compositions/HelloWorldWithImageAndAudio';
import { NameVideoTest } from './compositions/NameVideoTest';
import { NameVideoSimple } from './compositions/NameVideoSimple';
import { NameVideoUltraSimple } from './compositions/NameVideoUltraSimple';

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
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
            'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1751981193321_7ch9q7v0y.png',
          ],
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

      {/* Name Video Test Composition */}
      <Composition
        id="NameVideoTest"
        component={NameVideoTest}
        durationInFrames={300} // 5 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Nolan',
          letterAudioUrls: {
            "N": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104463999_c0863a2b-e7d0-486e-ab56-60af273272e0.mp3",
            "O": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104444762_02af0b39-c151-4505-b349-c9ff821533f7.mp3",
            "L": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104503689_52de36b2-f8bd-4094-9127-649676d399d5.mp3",
            "A": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752101241031_60a6ea3c-4658-413c-b66d-cffa571955c6.mp3"
          },
          debugMode: true
        }}
      />

      {/* Name Video Simple Composition */}
      <Composition
        id="NameVideoSimple"
        component={NameVideoSimple}
        durationInFrames={1800} // 30 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Nolan',
          childAge: 3,
          childTheme: 'halloween',
          backgroundMusicUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1751989180199.wav',
          backgroundMusicVolume: 0.25,
          introImageUrl: '',
          outroImageUrl: '',
          letterImageUrls: [],
          letterAudioUrls: {
            "N": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104463999_c0863a2b-e7d0-486e-ab56-60af273272e0.mp3",
            "O": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104444762_02af0b39-c151-4505-b349-c9ff821533f7.mp3",
            "L": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104503689_52de36b2-f8bd-4094-9127-649676d399d5.mp3",
            "A": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752101241031_60a6ea3c-4658-413c-b66d-cffa571955c6.mp3"
          },
          debugMode: true
        }}
      />

      <Composition
        id="NameVideoUltraSimple"
        component={NameVideoUltraSimple}
        durationInFrames={30 * 30} // 30 seconds
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Nolan',
          backgroundMusic: 'https://example.com/background.mp3',
        }}
      />

    </>
  );
};