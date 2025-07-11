import React from 'react';
import {
  AbsoluteFill, 
  Sequence, 
  useVideoConfig, 
  useCurrentFrame,
  spring,
  interpolate,
  Img,
  Audio
} from 'remotion';

export interface NameVideoProps {
  childName: string;
  childAge: number;
  childTheme: string;
  backgroundMusicUrl?: string;
  backgroundMusicVolume?: number;
  introImageUrl?: string;
  outroImageUrl?: string;
  letterImageUrls?: string[];
  introAudioUrl?: string;
  outroAudioUrl?: string;
  // Flat structure (like HelloWorldWithImageAndAudio)
  letterAudioUrl?: string;
  letterName?: string;
  // Nested structure (original NameVideo)
  audioAssets?: {
    fullName?: string;
    letters?: { [letter: string]: string };
  };
  letterAudioUrls?: { [letter: string]: { file_url: string } };
  debugMode?: boolean;
}

export const NameVideo: React.FC<NameVideoProps> = ({
  childName,
  childAge,
  childTheme,
  backgroundMusicUrl = 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752096424386.mp3',
  backgroundMusicVolume = 0.25,
  introImageUrl = '',
  outroImageUrl = '',
  letterImageUrls = [],
  introAudioUrl,
  outroAudioUrl,
  // Flat structure (like HelloWorldWithImageAndAudio)
  letterAudioUrl,
  letterName,
  // Nested structure (original NameVideo)
  audioAssets,
  debugMode = false
}) => {
  const { fps } = useVideoConfig();
  const segmentDuration = fps * 4; // 4 seconds per segment
  
  const nameUpper = childName.toUpperCase();
  const letters = nameUpper.split('');
  
  // Calculate total video duration
  const totalSegments = letters.length + 2; // intro + letters + outro
  const totalDuration = totalSegments * segmentDuration;
  
  // Get name audio from audioAssets - skip if it's a placeholder
  const rawNameAudio = audioAssets?.fullName || introAudioUrl || outroAudioUrl || '';
  const isValidAudioUrl = rawNameAudio && 
    rawNameAudio.startsWith('http') && 
    !rawNameAudio.includes('[Will be fetched');
  const nameAudio = isValidAudioUrl ? rawNameAudio : '';

  // Handle flat structure (like HelloWorldWithImageAndAudio)
  const flatLetterAudio = letterAudioUrl && letterAudioUrl.startsWith('http') ? letterAudioUrl : '';
  const flatLetterName = letterName || '';

  // STEP 2: Enhanced logging with letter audio debugging
  console.log(`🎬 STEP 2 - NameVideo for "${childName}":`, {
    letters: letters.length,
    segments: totalSegments,
    durationSeconds: totalDuration / fps,
    hasBackgroundMusic: !!backgroundMusicUrl,
    rawNameAudio,
    isValidAudioUrl,
    hasNameAudio: !!nameAudio,
    nameAudioUrl: nameAudio,
    // Letter audio debugging
    flatLetterAudio,
    flatLetterName,
    audioAssetsLetters: audioAssets?.letters,
    letterAudioUrls: Object.keys(audioAssets?.letters || {}),
    hasLetterAudio: !!Object.keys(audioAssets?.letters || {}).length
  });
  
  return (
    <AbsoluteFill style={{
      backgroundColor: '#4A90E2'
    }}>
      
      {/* Background Music */}
      {backgroundMusicUrl && backgroundMusicUrl.trim() !== '' && (
        <Audio 
          src={backgroundMusicUrl}
          volume={backgroundMusicVolume}
        />
      )}

      {/* Letter Audio - Single component with proper timing */}
      {/* COMMENTED OUT FOR DEBUGGING
      {letters.map((letter, index) => {
        const nestedLetterAudioUrl = audioAssets?.letters?.[letter];
        const letterAudioUrl = nestedLetterAudioUrl || 
          (flatLetterName === letter ? flatLetterAudio : '');
        
        if (!letterAudioUrl) return null;
        
        return (
          <Audio 
            key={`audio-${letter}-${index}`}
            src={letterAudioUrl}
            volume={0.8}
            startFrom={segmentDuration * (index + 1)} // Start at the beginning of each letter segment
            endAt={segmentDuration * (index + 2)} // End at the end of each letter segment
          />
        );
      })}
      */}

      {/* Intro/Outro Audio (name pronunciation) */}
      {/* COMMENTED OUT FOR DEBUGGING
      {audioAssets?.fullName && (
        <>
          <Audio 
            src={audioAssets.fullName}
            volume={0.8}
            startFrom={0}
            endAt={segmentDuration}
          />
          <Audio 
            src={audioAssets.fullName}
            volume={0.8}
            startFrom={segmentDuration * (letters.length + 1)}
            endAt={segmentDuration * (letters.length + 2)}
          />
        </>
      )}
      */}
      
      {/* Part 1: Intro - 4 seconds - CENTER */}
      <Sequence from={0} durationInFrames={segmentDuration}>
        {/* Intro Audio (name pronunciation) - COMMENTED OUT FOR DEBUGGING
        {audioAssets?.fullName && (
          <Audio 
            src={audioAssets.fullName}
            volume={0.8}
          />
        )}
        */}
        
        <TextSegment 
          text={nameUpper} 
          isFullName={true} 
          safeZone="center"
          backgroundImage={introImageUrl}
          debugMode={debugMode}
          segmentInfo={{ type: 'intro', text: nameUpper }}
        />
      </Sequence>

      {/* Part 2: Individual letters - 4 seconds each - ALTERNATING LEFT/RIGHT */}
      {letters.map((letter, index) => {
        const isLeft = index % 2 === 0;
        const safeZone = isLeft ? 'left' : 'right';
        const backgroundImage = letterImageUrls.length > 0 
          ? letterImageUrls[index % letterImageUrls.length]
          : undefined;
        
        // Get letter audio URL - support both flat and nested structures
        const nestedLetterAudioUrl = audioAssets?.letters?.[letter];
        const letterAudioUrl = nestedLetterAudioUrl || 
          (flatLetterName === letter ? flatLetterAudio : '');
        
        // STEP 3: Debug letter audio resolution
        console.log(`🎵 Letter "${letter}" audio debug:`, {
          letter,
          index,
          nestedLetterAudioUrl,
          flatLetterName,
          flatLetterAudio,
          finalLetterAudioUrl: letterAudioUrl,
          hasAudio: !!letterAudioUrl
        });
        
        return (
          <Sequence 
            key={`${letter}-${index}`}
            from={segmentDuration * (index + 1)} 
            durationInFrames={segmentDuration}
          >
            <TextSegment 
              text={letter} 
              isFullName={false} 
              safeZone={safeZone}
              backgroundImage={backgroundImage}
              debugMode={debugMode}
              segmentInfo={{ type: 'letter', text: letter, safeZone }}
            />
          </Sequence>
        );
      })}

      {/* Part 3: Outro - 4 seconds - CENTER */}
      <Sequence 
        from={segmentDuration * (letters.length + 1)} 
        durationInFrames={segmentDuration}
      >
        <TextSegment 
          text={nameUpper} 
          isFullName={true} 
          safeZone="center"
          backgroundImage={outroImageUrl}
          debugMode={debugMode}
          segmentInfo={{ type: 'outro', text: nameUpper }}
        />
      </Sequence>
      
    </AbsoluteFill>
  );
};

interface TextSegmentProps {
  text: string;
  isFullName: boolean;
  safeZone: 'left' | 'center' | 'right';
  backgroundImage?: string;
  debugMode?: boolean;
  segmentInfo: {
    type: 'intro' | 'letter' | 'outro';
    text: string;
    safeZone?: string;
  };
}

const TextSegment: React.FC<TextSegmentProps> = ({
  text, 
  isFullName, 
  safeZone, 
  backgroundImage, 
  debugMode,
  segmentInfo
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Spring animation for text entrance
  const textScale = spring({
    fps,
    frame,
    config: {
      damping: 200,
    },
  });

  // Fade in animation for background image
  const imageOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Text fade in animation 
  const textOpacity = interpolate(frame, [10, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Dynamic font sizing
  const baseFontSize = Math.min(width, height) * 0.3;
  const fullNameSize = Math.min(baseFontSize * (isFullName ? 0.8 : 1.4), width * 0.8);
  
  let adjustedSize;
  if (isFullName) {
    const lengthBasedSize = (width * 0.95) / text.length;
    const minSize = Math.min(width, height) * 0.08;
    const maxSize = Math.min(width, height) * 0.25;
    adjustedSize = Math.min(Math.max(lengthBasedSize, minSize), Math.min(fullNameSize, maxSize));
  } else {
    adjustedSize = fullNameSize;
  }

  const letterSpacing = isFullName ? `${adjustedSize * 0.03}px` : '0px';

  // Position text based on safe zone
  const getTextPosition = () => {
    const baseStyle = {
      fontSize: `${adjustedSize}px`,
      fontWeight: 'bold' as const,
      color: 'white',
      textShadow: `${adjustedSize * 0.03}px ${adjustedSize * 0.03}px ${adjustedSize * 0.06}px rgba(0, 0, 0, 0.8)`,
      fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      textAlign: 'center' as const,
      letterSpacing,
      lineHeight: '1.1',
      transform: `scale(${textScale})`,
      opacity: textOpacity,
      wordBreak: 'break-word' as const,
    };

    switch (safeZone) {
      case 'left':
        return {
          ...baseStyle,
          position: 'absolute' as const,
          left: '10%',
          top: '50%',
          transform: `translateY(-50%) scale(${textScale})`,
          width: '35%',
        };
      
      case 'right':
        return {
          ...baseStyle,
          position: 'absolute' as const,
          right: '10%',
          top: '50%',
          transform: `translateY(-50%) scale(${textScale})`,
          width: '35%',
        };
      
      case 'center':
      default:
        return {
          ...baseStyle,
          position: 'absolute' as const,
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${textScale})`,
          maxWidth: `${width * 0.95}px`,
        };
    }
  };

  return (
    <AbsoluteFill>
      {/* Background Image */}
      {backgroundImage && (
        <Img
          src={backgroundImage}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imageOpacity,
          }}
        />
      )}
      
      {/* Dark overlay for text readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }} />

      {/* Debug info */}
      {debugMode && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 1000,
        }}>
          <div><strong>Type:</strong> {segmentInfo.type}</div>
          <div><strong>Text:</strong> {segmentInfo.text}</div>
          <div><strong>Frame:</strong> {frame}</div>
          {segmentInfo.safeZone && <div><strong>Zone:</strong> {segmentInfo.safeZone}</div>}
          {backgroundImage && <div><strong>Image:</strong> ✅</div>}
        </div>
      )}

      {/* Text */}
      <div style={getTextPosition()}>
        {text}
      </div>
    </AbsoluteFill>
  );
};