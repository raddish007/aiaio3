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
  const oneSecondDelay = fps * 1; // 1 second delay in frames
  
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

  // Enhanced logging with letter audio debugging
  console.log(`🎬 NameVideo for "${childName}":`, {
    letters: letters.length,
    segments: totalSegments,
    durationSeconds: totalDuration / fps,
    fps,
    segmentDuration,
    oneSecondDelay,
    hasBackgroundMusic: !!backgroundMusicUrl,
    rawNameAudio,
    isValidAudioUrl,
    hasNameAudio: !!nameAudio,
    nameAudioUrl: nameAudio,
    // Audio timing
    introAudioStartFrame: oneSecondDelay,
    outroAudioStartFrame: segmentDuration * (letters.length + 1) + oneSecondDelay,
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

      {/* HYBRID APPROACH: Dynamic URLs with reliable Sequence timing */}
      
      {/* Name audio at start - using Sequence for reliable timing */}
      {nameAudio && (
        <Sequence from={oneSecondDelay} durationInFrames={segmentDuration - oneSecondDelay}>
          <Audio src={nameAudio} volume={0.8} />
        </Sequence>
      )}
      
      {/* Letter audio for each letter - using Sequence for reliable timing */}
      {letters.map((letter, index) => {
        const nestedLetterAudioUrl = audioAssets?.letters?.[letter];
        const letterAudioUrl = nestedLetterAudioUrl || 
          (flatLetterName === letter ? flatLetterAudio : '');
        
        if (!letterAudioUrl) return null;
        
        const letterSegmentStart = segmentDuration * (index + 1);
        
        console.log(`🎵 Letter "${letter}" audio timing:`, {
          letter,
          index,
          segmentStart: letterSegmentStart,
          audioUrl: letterAudioUrl,
          startTime: `${(letterSegmentStart / fps).toFixed(1)}s`,
          duration: `${((segmentDuration - oneSecondDelay) / fps).toFixed(1)}s`
        });
        
        return (
          <Sequence
            key={`audio-${letter}-${index}`}
            from={letterSegmentStart + oneSecondDelay}
            durationInFrames={segmentDuration - oneSecondDelay}
          >
            <Audio src={letterAudioUrl} volume={0.8} />
          </Sequence>
        );
      })}
      
      {/* Name audio at end - using Sequence for reliable timing */}
      {nameAudio && (
        <Sequence 
          from={segmentDuration * (letters.length + 1) + oneSecondDelay} 
          durationInFrames={segmentDuration - oneSecondDelay}
        >
          <Audio src={nameAudio} volume={0.8} />
        </Sequence>
      )}
      
      {/* Part 1: Intro - 4 seconds - CENTER */}
      <Sequence from={0} durationInFrames={segmentDuration}>
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

  // Enhanced dynamic font sizing for 2-13 character names
  const baseFontSize = Math.min(width, height) * 0.3;
  
  let adjustedSize;
  if (isFullName) {
    // Smart sizing for full names (2-13 characters)
    const nameLength = text.length;
    
    // Define size ranges for different name lengths
    let targetSize;
    if (nameLength <= 3) {
      // Short names (2-3 chars): Large size
      targetSize = Math.min(width, height) * 0.25;
    } else if (nameLength <= 5) {
      // Medium names (4-5 chars): Medium-large size
      targetSize = Math.min(width, height) * 0.20;
    } else if (nameLength <= 8) {
      // Long names (6-8 chars): Medium size
      targetSize = Math.min(width, height) * 0.15;
    } else {
      // Very long names (9-13 chars): Smaller size with length adjustment
      const lengthBasedSize = (width * 0.9) / nameLength;
      const minSize = Math.min(width, height) * 0.08;
      targetSize = Math.max(lengthBasedSize, minSize);
    }
    
    // Ensure it doesn't exceed maximum width
    adjustedSize = Math.min(targetSize, width * 0.85);
  } else {
    // Individual letters: consistent large size
    adjustedSize = Math.min(baseFontSize * 1.4, width * 0.8);
  }

  // Dynamic letter spacing based on name length and font size
  let letterSpacing;
  if (isFullName) {
    const nameLength = text.length;
    if (nameLength <= 3) {
      letterSpacing = `${adjustedSize * 0.05}px`; // More spacing for short names
    } else if (nameLength <= 5) {
      letterSpacing = `${adjustedSize * 0.03}px`; // Normal spacing for medium names
    } else {
      letterSpacing = `${adjustedSize * 0.02}px`; // Tighter spacing for long names
    }
  } else {
    letterSpacing = '0px'; // No spacing for individual letters
  }

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

  // Calculate current time for debug display
  const currentTime = frame / fps;
  const segmentStartTime = segmentInfo.type === 'intro' ? 0 : 
                          segmentInfo.type === 'outro' ? 'outro-start' : 
                          'letter-segment';

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

      {/* Enhanced Debug info with audio timing */}
      {debugMode && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '14px',
          fontFamily: 'monospace',
          zIndex: 1000,
          lineHeight: '1.4',
        }}>
          <div><strong>🎬 Segment:</strong> {segmentInfo.type}</div>
          <div><strong>📝 Text:</strong> {segmentInfo.text}</div>
          <div><strong>📏 Length:</strong> {segmentInfo.text.length} chars</div>
          <div><strong>🔤 Font Size:</strong> {Math.round(adjustedSize)}px</div>
          <div><strong>🎞️ Frame:</strong> {frame}</div>
          <div><strong>⏱️ Time:</strong> {currentTime.toFixed(1)}s</div>
          {segmentInfo.safeZone && <div><strong>📍 Zone:</strong> {segmentInfo.safeZone}</div>}
          {backgroundImage && <div><strong>🖼️ Image:</strong> ✅</div>}
          
          {/* Audio timing info */}
          {segmentInfo.type === 'intro' && (
            <div style={{ marginTop: '8px', borderTop: '1px solid #555', paddingTop: '8px' }}>
              <div><strong>🎤 Name Audio:</strong></div>
              <div>▶️ Starts: 1.0s</div>
              <div>⏹️ Ends: 4.0s</div>
            </div>
          )}
          
          {segmentInfo.type === 'outro' && (
            <div style={{ marginTop: '8px', borderTop: '1px solid #555', paddingTop: '8px' }}>
              <div><strong>🎤 Name Audio:</strong></div>
              <div>▶️ Starts: +1.0s into outro</div>
              <div>⏹️ Ends: at outro end</div>
            </div>
          )}
          
          {segmentInfo.type === 'letter' && (
            <div style={{ marginTop: '8px', borderTop: '1px solid #555', paddingTop: '8px' }}>
              <div><strong>🔤 Letter Audio:</strong></div>
              <div>▶️ Starts: +1.0s into segment</div>
              <div>⏹️ Ends: at segment end</div>
            </div>
          )}
        </div>
      )}

      {/* Text */}
      <div style={getTextPosition()}>
        {text}
      </div>
    </AbsoluteFill>
  );
};