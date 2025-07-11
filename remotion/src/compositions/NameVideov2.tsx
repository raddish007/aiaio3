import React from 'react';
import {
  AbsoluteFill, 
  Sequence, 
  useVideoConfig, 
  useCurrentFrame,
  spring,
  interpolate,
  Img
  // Audio
} from 'remotion';

export interface NameVideov2Props {
  childName: string;
  childAge: number;
  childTheme: string;
  // backgroundMusicUrl?: string;
  // backgroundMusicVolume?: number;
  introImageUrl?: string;
  outroImageUrl?: string;
  letterImageUrls?: string[];
  // introAudioUrl?: string;
  // outroAudioUrl?: string;
  // letterAudioUrls?: { [letter: string]: string };
  debugMode?: boolean;
}

export const NameVideov2: React.FC<NameVideov2Props> = ({
  childName,
  childAge,
  childTheme,
  // backgroundMusicUrl = '',
  // backgroundMusicVolume = 0.5,
  introImageUrl = '',
  outroImageUrl = '',
  letterImageUrls = [],
  // introAudioUrl = '',
  // outroAudioUrl = '',
  // letterAudioUrls = {},
  debugMode = false
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const segmentDuration = fps * 2; // 2 seconds per segment
  
  const nameUpper = childName.toUpperCase();
  const letters = nameUpper.split('');
  
  // Calculate total video duration
  const totalSegments = letters.length + 2; // intro + letters + outro
  const totalDuration = totalSegments * segmentDuration;
  
  // Log video info for debugging
  console.log(`🎬 NameVideov2 for "${childName}" (${letters.length} letters):`, {
    segments: totalSegments,
    durationSeconds: totalDuration / fps,
    durationFrames: totalDuration,
    theme: childTheme,
    age: childAge,
    // hasBackgroundMusic: !!backgroundMusicUrl,
    // backgroundMusicVolume,
    hasIntroImage: !!introImageUrl,
    // hasIntroAudio: !!introAudioUrl,
    letterImageCount: letterImageUrls.length,
    // letterAudioCount: Object.keys(letterAudioUrls).length,
    hasOutroImage: !!outroImageUrl,
    // hasOutroAudio: !!outroAudioUrl,
    letters: letters,
    segmentDuration: segmentDuration,
    timing: {
      intro: { from: 0, duration: segmentDuration },
      letters: letters.map((letter, index) => ({
        letter,
        from: segmentDuration * (index + 1),
        duration: segmentDuration,
        safeZone: index % 2 === 0 ? 'left' : 'right'
      })),
      outro: { from: segmentDuration * (letters.length + 1), duration: segmentDuration }
    }
  });
  
  return (
    <AbsoluteFill style={{
      backgroundColor: '#4A90E2'
    }}>
      
      {/* Background Music */}
      {/* {backgroundMusicUrl && backgroundMusicUrl.trim() !== '' && (
        <Audio 
          src={backgroundMusicUrl}
          volume={backgroundMusicVolume}
          startFrom={0}
          endAt={totalDuration}
          loop={false}
        />
      )} */}
      
      {/* Part 1: Intro - 4 seconds - CENTER */}
      <Sequence from={0} durationInFrames={segmentDuration}>
        <TextSegment 
          text={nameUpper} 
          isFullName={true} 
          safeZone="center"
          backgroundImage={introImageUrl}
          // audioUrl={introAudioUrl}
          debugMode={debugMode}
          segmentInfo={{
            type: 'intro',
            childName,
            childAge,
            childTheme,
            segmentIndex: 0
          }}
        />
      </Sequence>

      {/* Part 2: Individual letters - 4 seconds each - ALTERNATING LEFT/RIGHT */}
      {letters.map((letter, index) => {
        // Alternate between left and right
        const isLeft = index % 2 === 0;
        const safeZone = isLeft ? 'left' : 'right';
        
        // Get image for this letter (cycle through available images)
        const backgroundImage = letterImageUrls.length > 0 
          ? letterImageUrls[index % letterImageUrls.length]
          : undefined;
        
        // Get audio for this letter
        // const letterAudio = letterAudioUrls[letter] || undefined;
        
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
              // audioUrl={letterAudio}
              debugMode={debugMode}
              segmentInfo={{
                type: 'letter',
                childName,
                childAge,
                childTheme,
                segmentIndex: index + 1,
                letter,
                safeZone
              }}
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
          // audioUrl={outroAudioUrl}
          debugMode={debugMode}
          segmentInfo={{
            type: 'outro',
            childName,
            childAge,
            childTheme,
            segmentIndex: letters.length + 1
          }}
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
  // audioUrl?: string;
  debugMode?: boolean;
  segmentInfo: {
    type: 'intro' | 'letter' | 'outro';
    childName: string;
    childAge: number;
    childTheme: string;
    segmentIndex: number;
    letter?: string;
    safeZone?: string;
  };
}

const TextSegment: React.FC<TextSegmentProps> = ({
  text, 
  isFullName, 
  safeZone, 
  backgroundImage, 
  // audioUrl, 
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

  // Dynamic font sizing optimized for 2-13 character names
  const baseFontSize = Math.min(width, height) * 0.3; // 30% of smaller dimension
  const fullNameSize = Math.min(baseFontSize * (isFullName ? 0.8 : 1.4), width * 0.8);
  
  // Smart sizing for different name lengths
  let adjustedSize;
  if (isFullName) {
    // For full names: ensure readability for long names, prevent oversizing for short names
    const lengthBasedSize = (width * 0.95) / text.length;
    const minSize = Math.min(width, height) * 0.08; // Minimum 8% for very long names
    const maxSize = Math.min(width, height) * 0.25; // Maximum 25% for very short names
    adjustedSize = Math.min(Math.max(lengthBasedSize, minSize), Math.min(fullNameSize, maxSize));
  } else {
    // Individual letters: consistent large size
    adjustedSize = fullNameSize;
  }

  // Letter spacing for full names - adjusted for larger text
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
      whiteSpace: 'nowrap' as const, // Prevent line breaks
      overflow: 'hidden' as const,
      textOverflow: 'ellipsis' as const,
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
          width: 'auto', // Allow natural width for center text
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

      {/* Audio for this segment */}
      {/* {audioUrl && (
        <Audio 
          src={audioUrl}
          volume={0.25}
        />
      )} */}

      {/* Debug Overlay */}
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
          <div><strong>Segment:</strong> {segmentInfo.type}</div>
          <div><strong>Child:</strong> {segmentInfo.childName} ({segmentInfo.childAge})</div>
          <div><strong>Theme:</strong> {segmentInfo.childTheme}</div>
          <div><strong>Safe Zone:</strong> {safeZone}</div>
          <div><strong>Text:</strong> {text}</div>
          <div><strong>Frame:</strong> {frame}</div>
          {segmentInfo.letter && <div><strong>Letter:</strong> {segmentInfo.letter}</div>}
          {backgroundImage && <div><strong>Image:</strong> ✅</div>}
          {/* {audioUrl && <div><strong>Audio:</strong> ✅</div>} */}
        </div>
      )}

      {/* Text positioned in safe zone */}
      <div style={getTextPosition()}>
        {text}
      </div>
    </AbsoluteFill>
  );
}; 