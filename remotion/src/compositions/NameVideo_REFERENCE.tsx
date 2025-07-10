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
  dinosaurAssets?: Array<{
    id: string;
    file_url: string;
    safe_zone: 'left' | 'center' | 'right';
  }>;
  // Enhanced props for database-connected template
  assets?: Array<{
    id: string;
    title: string;
    file_url: string;
    themes: string[];
    metadata: {
      safeZone?: 'left' | 'center' | 'right';
      [key: string]: any;
    };
  }>;
  themes?: string[];
  // Audio assets for name pronunciation
  audioAssets?: {
    fullName?: string; // URL to full name audio
    letters?: { [letter: string]: string }; // Map of letter -> audio URL
  };
}

export const NameVideo: React.FC<NameVideoProps> = ({childName, dinosaurAssets = [], assets = [], themes = [], audioAssets}) => {
  const {fps} = useVideoConfig();
  const segmentDuration = fps * 4; // 4 seconds per segment
  
  const nameUpper = childName.toUpperCase();
  const letters = nameUpper.split('');
  
  // Handle both old and new asset formats
  let centerAssets: any[] = [];
  let leftAssets: any[] = [];
  let rightAssets: any[] = [];
  
  if (assets.length > 0) {
    // Use enhanced assets format
    centerAssets = assets.filter(asset => asset.metadata?.safeZone === 'center');
    leftAssets = assets.filter(asset => asset.metadata?.safeZone === 'left');
    rightAssets = assets.filter(asset => asset.metadata?.safeZone === 'right');
  } else {
    // Use legacy dinosaur assets format
    centerAssets = dinosaurAssets.filter(asset => asset.safe_zone === 'center');
    leftAssets = dinosaurAssets.filter(asset => asset.safe_zone === 'left');
    rightAssets = dinosaurAssets.filter(asset => asset.safe_zone === 'right');
  }
  
  // Get random center image for intro/outro
  const introImage = centerAssets.length > 0 
    ? centerAssets[Math.floor(Math.random() * centerAssets.length)]
    : null;
  
  const outroImage = centerAssets.length > 0 
    ? centerAssets[Math.floor(Math.random() * centerAssets.length)]
    : null;
  
  // Calculate total video duration and log info
  const totalSegments = letters.length + 2;
  const totalDuration = totalSegments * segmentDuration;
  
  // Only log if we have assets to work with
  if (assets.length > 0 || dinosaurAssets.length > 0) {
    console.log(`🎬 Video for "${childName}" (${letters.length} letters):`, {
      segments: totalSegments,
      durationSeconds: totalDuration / fps,
      durationFrames: totalDuration,
      assetFormat: assets.length > 0 ? 'enhanced' : 'legacy',
      themes: themes.length > 0 ? themes : ['Dinosaurs (default)'],
      availableAssets: {
        center: centerAssets.length,
        left: leftAssets.length,
        right: rightAssets.length
      },
      audioAssets: audioAssets ? {
        hasFullName: !!audioAssets.fullName,
        letterCount: audioAssets.letters ? Object.keys(audioAssets.letters).length : 0,
        availableLetters: audioAssets.letters ? Object.keys(audioAssets.letters) : []
      } : 'No audio assets'
    });
  }
  
  return (
    <AbsoluteFill style={{backgroundColor: '#4A90E2'}}>
      
      {/* Audio Playback */}
      {audioAssets && (
        <>
          {/* Full name audio at start */}
          {audioAssets.fullName && (
            <Audio src={audioAssets.fullName} />
          )}
          
          {/* Individual letter audio - timed to play during each letter segment */}
          {audioAssets.letters && letters.map((letter, index) => {
            const letterAudio = audioAssets.letters![letter];
            if (!letterAudio) return null;
            
            return (
              <Audio 
                key={`audio-${letter}-${index}`}
                src={letterAudio}
                startFrom={segmentDuration * (index + 1)} // Start when letter segment begins
              />
            );
          })}
          
          {/* Full name audio at end */}
          {audioAssets.fullName && (
            <Audio 
              src={audioAssets.fullName}
              startFrom={segmentDuration * (letters.length + 1)} // Start when final name segment begins
            />
          )}
        </>
      )}
      
      {/* Full name intro - 4 seconds - CENTER */}
      <Sequence from={0} durationInFrames={segmentDuration}>
        <TextSegment 
          text={nameUpper} 
          isFullName={true} 
          safeZone="center"
          backgroundImage={introImage?.file_url}
        />
      </Sequence>

      {/* Individual letters - 4 seconds each - ALTERNATING LEFT/RIGHT */}
      {letters.map((letter, index) => {
        // Alternate between left and right
        const isLeft = index % 2 === 0;
        const safeZone = isLeft ? 'left' : 'right';
        const availableAssets = isLeft ? leftAssets : rightAssets;
        
        // Get random image from appropriate safe zone
        const backgroundImage = availableAssets.length > 0 
          ? availableAssets[Math.floor(Math.random() * availableAssets.length)].file_url
          : null;
        
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
            />
          </Sequence>
        );
      })}

      {/* Final full name - 4 seconds - CENTER */}
      <Sequence 
        from={segmentDuration * (letters.length + 1)} 
        durationInFrames={segmentDuration}
      >
        <TextSegment 
          text={nameUpper} 
          isFullName={true} 
          safeZone="center"
          backgroundImage={outroImage?.file_url}
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
}

const TextSegment: React.FC<TextSegmentProps> = ({text, isFullName, safeZone, backgroundImage}) => {
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

      {/* Text positioned in safe zone */}
      <div style={getTextPosition()}>
        {text}
      </div>
    </AbsoluteFill>
  );
};