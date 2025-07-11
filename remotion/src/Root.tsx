import { Composition } from 'remotion';

import { NameVideo } from './compositions/NameVideo';
import { NameVideov2 } from './compositions/NameVideov2';
import { Lullaby } from './compositions/Lullaby';
import { HelloWorld } from './compositions/HelloWorld';
import { HelloWorldWithImage } from './compositions/HelloWorldWithImage';



export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Name Video Composition - Nolan (5 letters) */}
      <Composition
        id="NameVideo-Nolan"
        component={NameVideo}
        durationInFrames={3600} // Maximum duration for up to 13 letters
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Nolan',
          childTheme: 'halloween',
          childAge: 3,
          backgroundMusicUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1751989180199.wav',
          backgroundMusicVolume: 0.5,
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
          debugMode: false
        }}
      />


      {/* Name Video Composition - Lorelei (8 letters) */}
      <Composition
        id="NameVideo-Lorelei"
        component={NameVideo}
        durationInFrames={3600} // Maximum duration for up to 13 letters
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Lorelei',
          childTheme: 'halloween',
          childAge: 3,
          backgroundMusicUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1751989180199.wav',
          backgroundMusicVolume: 0.5,
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
          debugMode: false
        }}
      />

{/* Name Video Composition */}
<Composition
        id="NameVideo"
        component={NameVideo}
        durationInFrames={720} // Default fallback (24 seconds for 4-letter name at 30fps)
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          childName: 'Liam',
          childAge: 2,
          childTheme: 'dinosaurs',
          backgroundMusicUrl: '',
          backgroundMusicVolume: 0.25,
          introImageUrl: '',
          outroImageUrl: '',
          letterImageUrls: [],
          introAudioUrl: '',
          outroAudioUrl: '',
          audioAssets: {
            fullName: '',
            letters: {}
          },
          letterAudioUrls: {}, // Support old structure as fallback
          debugMode: true, // FORCE DEBUG MODE FOR TROUBLESHOOTING
        }}
        calculateMetadata={({ props }) => {
          const nameLength = props.childName?.length || 4;
          const totalSegments = nameLength + 2; // intro + letters + outro
          const segmentDuration = 30 * 4; // 4 seconds per segment at 30fps
          const calculatedDuration = totalSegments * segmentDuration;
          
          console.log(`🎬 Dynamic duration calculation for "${props.childName}":`, {
            nameLength,
            totalSegments,
            durationSeconds: calculatedDuration / 30,
            durationFrames: calculatedDuration
          });
          
          return {
            durationInFrames: calculatedDuration,
          };
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

    </>
  );
}; 