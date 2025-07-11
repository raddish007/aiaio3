import React, { useMemo } from 'react';
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
  // NEW: Letter images with safe zone metadata
  letterImagesWithMetadata?: { url: string; safeZone: 'left' | 'right' }[];
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

// Helper function to get theme-based gradient colors
const getThemeGradient = (theme: string): string => {
  const gradients: { [key: string]: string } = {
    halloween: '#FF6B35, #F7931E, #FFB84D',
    space: '#1A1A2E, #16213E, #0F3460',
    dinosaurs: '#2E7D32, #388E3C, #4CAF50',
    animals: '#8D6E63, #A1887F, #BCAAA4',
    princesses: '#E91E63, #F06292, #F8BBD9',
    default: '#4A90E2, #6BB6FF, #90CAF9'
  };
  
  return gradients[theme.toLowerCase()] || gradients.default;
};

export const NameVideo: React.FC<NameVideoProps> = ({
  childName,
  childAge,
  childTheme,
  backgroundMusicUrl = 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/happybg_low.MP3',
  backgroundMusicVolume = 0.25,
  introImageUrl = '',
  outroImageUrl = '',
  letterImageUrls = [],
  letterImagesWithMetadata = [],
  introAudioUrl,
  outroAudioUrl,
  // Flat structure (like HelloWorldWithImageAndAudio)
  letterAudioUrl,
  letterName,
  // Nested structure (original NameVideo)
  audioAssets,
  debugMode = false
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const segmentDuration = fps * 4; // 4 seconds per segment
  const oneSecondDelay = fps * 1; // 1 second delay in frames
  
  const nameUpper = childName.toUpperCase();
  const letters = nameUpper.split('');
  
  // Calculate total video duration
  const totalSegments = letters.length + 2; // intro + letters + outro
  const totalDuration = totalSegments * segmentDuration;
  
  // Fade frames for 0.5 second transitions
  const fadeFrames = fps * 0.5;
  
  // Calculate background music volume with fade in/out
  const backgroundMusicVolumeWithFade = (() => {
    // Use the composition's durationInFrames for accurate timing
    const totalFrames = durationInFrames;
    
    // Fade in at start
    if (frame < fadeFrames) {
      return backgroundMusicVolume * (frame / fadeFrames);
    }
    
    // Fade out at end
    if (frame > totalFrames - fadeFrames) {
      return backgroundMusicVolume * ((totalFrames - frame) / fadeFrames);
    }
    
    // Normal volume in between
    return backgroundMusicVolume;
  })();
  
  // Get name audio from audioAssets - skip if it's a placeholder
  const rawNameAudio = audioAssets?.fullName || introAudioUrl || outroAudioUrl || '';
  const isValidAudioUrl = rawNameAudio && 
    rawNameAudio.startsWith('http') && 
    !rawNameAudio.includes('[Will be fetched');
  const nameAudio = isValidAudioUrl ? rawNameAudio : '';

  // Handle flat structure (like HelloWorldWithImageAndAudio)
  const flatLetterAudio = letterAudioUrl && letterAudioUrl.startsWith('http') ? letterAudioUrl : '';
  const flatLetterName = letterName || '';

  // Calculate safe zone requirements for the name
  const leftLetterCount = Math.ceil(letters.length / 2); // Even indices (0, 2, 4, 6...)
  const rightLetterCount = Math.floor(letters.length / 2); // Odd indices (1, 3, 5...)
  
  console.log(`🗺️ Safe zone mapping for "${childName}":`, {
    totalLetters: letters.length,
    leftLetters: leftLetterCount,
    rightLetters: rightLetterCount,
    totalImages: letterImageUrls.length,
    pattern: letters.map((letter, i) => `${letter}(${i % 2 === 0 ? 'LEFT' : 'RIGHT'})`).join(' ')
  });

  // Pre-select all letter images once to prevent flashing
  const preSelectedLetterImages = useMemo(() => {
    const selectedImages: string[] = [];
    
    letters.forEach((letter, index) => {
      const isLeft = index % 2 === 0;
      const safeZone = isLeft ? 'left' : 'right';
      
      // Use the new metadata-based approach if available
      if (letterImagesWithMetadata && letterImagesWithMetadata.length > 0) {
        // Filter images by the requested safe zone
        const zoneImages = letterImagesWithMetadata.filter(img => img.safeZone === safeZone);
        
        console.log(`🖼️ Pre-selecting image for letter ${index} (${safeZone}):`, {
          totalImages: letterImagesWithMetadata.length,
          zoneImages: zoneImages.length,
          requestedZone: safeZone
        });
        
        if (zoneImages.length === 0) {
          console.warn(`⚠️ No ${safeZone} images available in metadata, using fallback`);
          // Use any available image as fallback
          selectedImages[index] = letterImagesWithMetadata[0]?.url || '';
        } else {
          // Use deterministic selection based on index to prevent flickering
          const imageIndex = index % zoneImages.length;
          const selectedImage = zoneImages[imageIndex];
          
          console.log(`🖼️ Letter ${index} (${safeZone}): Selected image ${imageIndex}/${zoneImages.length} = ${selectedImage.url}`);
          selectedImages[index] = selectedImage.url;
        }
      } else {
        // Fallback to old logic if metadata not available
        if (letterImageUrls.length === 0) {
          selectedImages[index] = '';
        } else {
          console.warn(`⚠️ Using fallback image splitting logic (no metadata available)`);
          
          // Split images by safe zone - assume first half are left-safe, second half are right-safe
          const midPoint = Math.ceil(letterImageUrls.length / 2);
          const leftImages = letterImageUrls.slice(0, midPoint);
          const rightImages = letterImageUrls.slice(midPoint);
          
          // Select the appropriate image pool based on safe zone
          const zoneImages = safeZone === 'left' ? leftImages : rightImages;
          
          if (zoneImages.length === 0) {
            console.warn(`⚠️ No ${safeZone} images available, using any available image`);
            selectedImages[index] = letterImageUrls[0] || '';
          } else {
            // Use deterministic selection based on index to prevent flickering
            const imageIndex = index % zoneImages.length;
            const selectedImage = zoneImages[imageIndex];
            
            console.log(`🖼️ Letter ${index} (${safeZone}): Selected fallback image ${imageIndex}/${zoneImages.length} = ${selectedImage}`);
            selectedImages[index] = selectedImage;
          }
        }
      }
    });
    
    console.log(`🖼️ Pre-selected all letter images:`, selectedImages);
    return selectedImages;
  }, [letters, letterImagesWithMetadata, letterImageUrls]);

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
          volume={backgroundMusicVolumeWithFade}
        />
      )}

      {/* HYBRID APPROACH: Dynamic URLs with reliable Sequence timing */}
      
      {/* Name audio at start - using Sequence for reliable timing */}
      {nameAudio && (
        <Sequence from={oneSecondDelay} durationInFrames={segmentDuration - oneSecondDelay}>
          <Audio 
            src={nameAudio} 
            volume={(frame) => {
              const fadeFrames = fps * 0.5; // 0.5 second fade
              const sequenceDuration = segmentDuration - oneSecondDelay;
              
              // Fade in at start
              if (frame < fadeFrames) {
                return 0.8 * (frame / fadeFrames);
              }
              
              // Fade out at end
              if (frame > sequenceDuration - fadeFrames) {
                return 0.8 * ((sequenceDuration - frame) / fadeFrames);
              }
              
              // Normal volume in between
              return 0.8;
            }}
          />
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
            <Audio 
              src={letterAudioUrl} 
              volume={(frame) => {
                const fadeFrames = fps * 0.5; // 0.5 second fade
                const sequenceDuration = segmentDuration - oneSecondDelay;
                
                // Fade in at start
                if (frame < fadeFrames) {
                  return 0.8 * (frame / fadeFrames);
                }
                
                // Fade out at end
                if (frame > sequenceDuration - fadeFrames) {
                  return 0.8 * ((sequenceDuration - frame) / fadeFrames);
                }
                
                // Normal volume in between
                return 0.8;
              }}
            />
          </Sequence>
        );
      })}
      
      {/* Name audio at end - using Sequence for reliable timing */}
      {nameAudio && (
        <Sequence 
          from={segmentDuration * (letters.length + 1) + oneSecondDelay} 
          durationInFrames={segmentDuration - oneSecondDelay}
        >
          <Audio 
            src={nameAudio} 
            volume={(frame) => {
              const fadeFrames = fps * 0.5; // 0.5 second fade
              const sequenceDuration = segmentDuration - oneSecondDelay;
              
              // Fade in at start
              if (frame < fadeFrames) {
                return 0.8 * (frame / fadeFrames);
              }
              
              // Fade out at end
              if (frame > sequenceDuration - fadeFrames) {
                return 0.8 * ((sequenceDuration - frame) / fadeFrames);
              }
              
              // Normal volume in between
              return 0.8;
            }}
          />
        </Sequence>
      )}
      
      {/* Part 1: Intro - 4 seconds - CENTER */}
      <Sequence from={0} durationInFrames={segmentDuration}>
        <TextSegment 
          text={nameUpper} 
          isFullName={true} 
          safeZone="center"
          backgroundImage={introImageUrl}
          childTheme={childTheme}
          debugMode={debugMode}
          segmentInfo={{ type: 'intro', text: nameUpper }}
        />
      </Sequence>

      {/* Part 2: Individual letters - 4 seconds each - ALTERNATING LEFT/RIGHT */}
      {letters.map((letter, index) => {
        const isLeft = index % 2 === 0;
        const safeZone = isLeft ? 'left' : 'right';
        const backgroundImage = preSelectedLetterImages[index];
        
        console.log(`🎬 Letter "${letter}" rendering:`, {
          letter,
          index,
          isLeft,
          safeZone,
          imageUrl: backgroundImage,
          totalImages: letterImageUrls.length,
          segmentStart: segmentDuration * (index + 1),
          segmentDuration
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
              childTheme={childTheme}
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
          childTheme={childTheme}
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
  childTheme: string;
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
  childTheme,
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

  // Fade frames for 0.5 second transitions
  const fadeFrames = fps * 0.5;
  const segmentFrames = fps * 4; // 4 second segments

  // Fade in/out animation for background image
  const imageOpacity = interpolate(frame, [0, fadeFrames, segmentFrames - fadeFrames, segmentFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Text fade in/out animation 
  const textOpacity = interpolate(frame, [10, 40, segmentFrames - fadeFrames, segmentFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Enhanced dynamic font sizing for 2-13 character names (10% smaller for long names)
  const baseFontSize = Math.min(width, height) * 0.3;
  
  let adjustedSize;
  if (isFullName) {
    // Smart sizing for full names (2-13 characters) - reduced by ~10% for longer names
    const nameLength = text.length;
    
    // Define size ranges for different name lengths
    let targetSize;
    if (nameLength <= 3) {
      // Short names (2-3 chars): Large size (unchanged)
      targetSize = Math.min(width, height) * 0.25;
    } else if (nameLength <= 5) {
      // Medium names (4-5 chars): Medium-large size (slightly reduced)
      targetSize = Math.min(width, height) * 0.18; // Reduced from 0.20
    } else if (nameLength <= 8) {
      // Long names (6-8 chars): Medium size (reduced)
      targetSize = Math.min(width, height) * 0.13; // Reduced from 0.15
    } else if (nameLength <= 10) {
      // Very long names (9-10 chars): Significantly reduced for better fit
      const singleLineSize = (width * 0.75) / nameLength * 1.4; 
      const heightBasedSize = Math.min(width, height) * 0.07;
      targetSize = Math.max(singleLineSize, heightBasedSize);
    } else {
      // Extremely long names (11+ chars): Maximum reduction for smallest safe areas
      // Use smallest percentage of width and reduced multiplier for very tight fitting
      const singleLineSize = (width * 0.65) / nameLength * 1.2; 
      const heightBasedSize = Math.min(width, height) * 0.05;
      targetSize = Math.max(singleLineSize, heightBasedSize);
    }
    
    // Ensure it doesn't exceed maximum width and force single line (more aggressive for longer names)
    if (nameLength <= 10) {
      adjustedSize = Math.min(targetSize, width * 0.75 / nameLength * 1.4);
    } else {
      adjustedSize = Math.min(targetSize, width * 0.65 / nameLength * 1.2); // Most aggressive for 11+ chars
    }
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
      whiteSpace: 'nowrap' as const, // Force single line
      overflow: 'visible' as const, // Allow text to extend if needed
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
          maxWidth: 'none', // Remove max width constraint to allow single line
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
      {/* Background Image with Error Handling */}
      {backgroundImage && (
        <Img
          src={backgroundImage}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imageOpacity,
          }}
          onError={(e) => {
            console.warn(`🖼️ Image failed to load: ${backgroundImage}`);
            // Hide the image if it fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      
      {/* Fallback gradient background if no image or image fails */}
      {!backgroundImage && (
        <div style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${getThemeGradient(childTheme)})`,
          opacity: imageOpacity,
        }} />
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