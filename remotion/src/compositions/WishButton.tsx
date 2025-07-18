import React, { useMemo, useEffect } from 'react';
import {
  AbsoluteFill, 
  Sequence, 
  useVideoConfig, 
  useCurrentFrame,
  spring,
  interpolate,
  Img,
  Audio,
  continueRender,
  delayRender,
  prefetch
} from 'remotion';

export interface AssetItem {
  url: string;
  status: 'missing' | 'generating' | 'ready';
}

export interface StoryVariables {
  childName: string;
  theme: string;
  visualStyle: string;
  mainCharacter: string;
  sidekick: string;
  wishResultItems: string;
  buttonLocation: string;
  magicButton: string;
  chaoticActions: string;
  realizationEmotion: string;
  missedSimpleThing: string;
  finalScene: string;
}

export interface WishButtonAssets {
  page1_image: AssetItem;
  page1_audio: AssetItem;
  page2_image: AssetItem;
  page2_audio: AssetItem;
  background_music: AssetItem;
}

export interface WishButtonProps {
  childName: string;
  theme: string;
  storyVariables: StoryVariables;
  assets: WishButtonAssets;
}

// Helper function to get theme-based gradient colors
const getThemeGradient = (theme: string): string => {
  const gradients: { [key: string]: string } = {
    monsters: '#4A148C, #7B1FA2, #9C27B0', // Purple gradient for monsters
    dinosaurs: '#2E7D32, #388E3C, #4CAF50', // Green gradient for dinosaurs
    space: '#1A1A2E, #16213E, #0F3460', // Dark blue gradient for space
    halloween: '#FF6F00, #FF8F00, #FFB300', // Orange gradient for halloween
    animals: '#8D6E63, #A1887F, #BCAAA4', // Brown gradient for animals
    princesses: '#E91E63, #F06292, #F8BBD9', // Pink gradient for princesses
    vehicles: '#1976D2, #42A5F5, #90CAF9', // Blue gradient for vehicles
    dogs: '#8D6E63, #A1887F, #BCAAA4', // Brown gradient for dogs
    cats: '#9E9E9E, #BDBDBD, #E0E0E0', // Gray gradient for cats
    default: '#4A90E2, #6BB6FF, #90CAF9' // Default blue gradient
  };
  
  return gradients[theme.toLowerCase()] || gradients.default;
};

// Helper function to calculate dynamic font size based on text length
const calculateFontSize = (textLength: number, baseSize: number = 80): number => {
  if (textLength <= 20) return baseSize;
  if (textLength <= 30) return baseSize * 0.8;
  if (textLength <= 40) return baseSize * 0.65;
  if (textLength <= 60) return baseSize * 0.5;
  return baseSize * 0.4;
};

export const WishButton: React.FC<WishButtonProps> = ({
  childName,
  theme,
  storyVariables,
  assets
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Preload all assets for better performance
  const preloadingHandle = useMemo(() => {
    const handle = delayRender('Preloading Wish Button assets');
    
    const preloadPromises = [];
    
    // Preload images if they exist
    if (assets.page1_image?.url && assets.page1_image.status === 'ready') {
      preloadPromises.push(prefetch(assets.page1_image.url));
    }
    if (assets.page2_image?.url && assets.page2_image.status === 'ready') {
      preloadPromises.push(prefetch(assets.page2_image.url));
    }
    
    // Preload audio if they exist
    if (assets.page1_audio?.url && assets.page1_audio.status === 'ready') {
      preloadPromises.push(prefetch(assets.page1_audio.url));
    }
    if (assets.page2_audio?.url && assets.page2_audio.status === 'ready') {
      preloadPromises.push(prefetch(assets.page2_audio.url));
    }
    if (assets.background_music?.url && assets.background_music.status === 'ready') {
      preloadPromises.push(prefetch(assets.background_music.url));
    }
    
    if (preloadPromises.length > 0) {
      Promise.all(preloadPromises)
        .then(() => {
          console.log('✅ All Wish Button assets preloaded successfully');
          continueRender(handle);
        })
        .catch((err) => {
          console.warn('⚠️ Some assets failed to preload:', err);
          // Continue rendering even if preloading fails
          continueRender(handle);
        });
    } else {
      // No assets to preload, continue immediately
      continueRender(handle);
    }
    
    return handle;
  }, [assets]);

  // Define segment durations 
  const segmentDuration = 8 * fps; // 8 seconds per page
  
  const segments = [
    { name: 'page1', start: 0, duration: segmentDuration },
    { name: 'page2', start: segmentDuration, duration: segmentDuration }
  ];

  // Animation helpers
  const bounceIn = (startFrame: number) => {
    return spring({
      frame: frame - startFrame,
      fps,
      config: {
        damping: 8,
        stiffness: 100,
        mass: 0.8,
      },
    });
  };

  const crossFade = (startFrame: number, endFrame: number) => {
    return interpolate(
      frame,
      [startFrame, startFrame + 30, endFrame - 30, endFrame],
      [0, 1, 1, 0],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );
  };

  // Generate story text
  const page1Text = `A Wish Button for ${childName}`;
  const page2Text = `${childName} loved ${storyVariables.wishResultItems}. Not just a little—a lot! More ${storyVariables.wishResultItems}, more everything!`;

  // Background style based on theme
  const backgroundStyle = {
    background: `linear-gradient(135deg, ${getThemeGradient(theme)})`,
    width: '100%',
    height: '100%',
  };

  return (
    <AbsoluteFill>
      {/* Background Music - plays throughout entire video */}
      {assets.background_music?.status === 'ready' && assets.background_music?.url && (
        <Sequence from={0} durationInFrames={durationInFrames}>
          <Audio 
            src={assets.background_music.url} 
            volume={0.3} // Lower volume so it doesn't compete with narration
          />
        </Sequence>
      )}

      {/* PAGE 1: Title Page (0-8 seconds) */}
      <Sequence from={segments[0].start} durationInFrames={segments[0].duration}>
        <AbsoluteFill style={{ 
          opacity: crossFade(segments[0].start, segments[0].start + segments[0].duration)
        }}>
          {/* Page 1 Background Image */}
          {assets.page1_image?.status === 'ready' && assets.page1_image?.url ? (
            <Img 
              src={assets.page1_image.url} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${bounceIn(segments[0].start)})`
              }}
            />
          ) : (
            // Fallback background if no image
            <div style={backgroundStyle} />
          )}

          {/* Page 1 Title Text Overlay */}
          <div style={{
            position: 'absolute',
            right: '10%',
            top: '50%',
            width: '40%',
            transform: 'translateY(-50%)',
            textAlign: 'center',
            zIndex: 10
          }}>
            <div style={{
              fontSize: `${calculateFontSize(page1Text.length, 72)}px`,
              fontWeight: 'bold',
              color: 'white',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              padding: '20px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '20px',
              transform: `scale(${bounceIn(segments[0].start)})`
            }}>
              {page1Text}
            </div>
          </div>

          {/* Page 1 Audio - starts 2 seconds into segment */}
          {assets.page1_audio?.status === 'ready' && assets.page1_audio?.url && (
            <Sequence 
              from={2 * fps} // Start 2 seconds into page 1
              durationInFrames={Math.min(segments[0].duration - 2 * fps, 6 * fps)} // Play for remaining duration or 6 seconds max
            >
              <Audio 
                src={assets.page1_audio.url} 
                volume={(frame) => {
                  const fadeFrames = fps * 0.3; // 0.3 second fade
                  const sequenceDuration = Math.min(segments[0].duration - 2 * fps, 6 * fps);
                  
                  // Fade in at start
                  if (frame < fadeFrames) {
                    return 0.9 * (frame / fadeFrames);
                  }
                  
                  // Fade out at end
                  if (frame > sequenceDuration - fadeFrames) {
                    return 0.9 * ((sequenceDuration - frame) / fadeFrames);
                  }
                  
                  // Normal volume in between
                  return 0.9;
                }}
              />
            </Sequence>
          )}
        </AbsoluteFill>
      </Sequence>

      {/* PAGE 2: Story Page (8-16 seconds) */}
      <Sequence from={segments[1].start} durationInFrames={segments[1].duration}>
        <AbsoluteFill style={{ 
          opacity: crossFade(segments[1].start, segments[1].start + segments[1].duration)
        }}>
          {/* Page 2 Background Image */}
          {assets.page2_image?.status === 'ready' && assets.page2_image?.url ? (
            <Img 
              src={assets.page2_image.url} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${bounceIn(segments[1].start)})`
              }}
            />
          ) : (
            // Fallback background if no image
            <div style={backgroundStyle} />
          )}

          {/* Page 2 Story Text Overlay */}
          <div style={{
            position: 'absolute',
            right: '10%',
            top: '50%',
            width: '40%',
            transform: 'translateY(-50%)',
            textAlign: 'center',
            zIndex: 10
          }}>
            <div style={{
              fontSize: `${calculateFontSize(page2Text.length, 56)}px`,
              fontWeight: 'bold',
              color: 'white',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              padding: '20px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '20px',
              lineHeight: '1.2',
              transform: `scale(${bounceIn(segments[1].start)})`
            }}>
              {page2Text}
            </div>
          </div>

          {/* Page 2 Audio - starts 1 second into segment */}
          {assets.page2_audio?.status === 'ready' && assets.page2_audio?.url && (
            <Sequence 
              from={fps} // Start 1 second into page 2
              durationInFrames={Math.min(segments[1].duration - fps, 7 * fps)} // Play for remaining duration or 7 seconds max
            >
              <Audio 
                src={assets.page2_audio.url} 
                volume={(frame) => {
                  const fadeFrames = fps * 0.3; // 0.3 second fade
                  const sequenceDuration = Math.min(segments[1].duration - fps, 7 * fps);
                  
                  // Fade in at start
                  if (frame < fadeFrames) {
                    return 0.9 * (frame / fadeFrames);
                  }
                  
                  // Fade out at end
                  if (frame > sequenceDuration - fadeFrames) {
                    return 0.9 * ((sequenceDuration - frame) / fadeFrames);
                  }
                  
                  // Normal volume in between
                  return 0.9;
                }}
              />
            </Sequence>
          )}
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
