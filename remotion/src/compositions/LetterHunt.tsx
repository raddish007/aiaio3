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
  Video,
  continueRender,
  delayRender,
  prefetch
} from 'remotion';

export interface AssetItem {
  url: string;
  status: 'missing' | 'generating' | 'ready';
}

export interface LetterHuntAssets {
  titleCard: AssetItem;
  introVideo: AssetItem;
  intro2Video: AssetItem;
  signImage: AssetItem;
  bookImage: AssetItem;
  groceryImage: AssetItem;
  happyDanceVideo: AssetItem;
  endingImage: AssetItem;
  titleAudio: AssetItem;
  introAudio: AssetItem;
  intro2Audio: AssetItem;
  signAudio: AssetItem;
  bookAudio: AssetItem;
  groceryAudio: AssetItem;
  happyDanceAudio: AssetItem;
  endingAudio: AssetItem;
  backgroundMusic: AssetItem;
}

export interface LetterHuntProps {
  childName: string;
  targetLetter: string;
  childTheme: string;
  childAge: number;
  assets: LetterHuntAssets;
}

// Helper function to get theme-based gradient colors
const getThemeGradient = (theme: string): string => {
  const gradients: { [key: string]: string } = {
    monsters: '#4A148C, #7B1FA2, #9C27B0', // Purple gradient for monsters
    dinosaurs: '#2E7D32, #388E3C, #4CAF50',
    space: '#1A1A2E, #16213E, #0F3460',
    animals: '#8D6E63, #A1887F, #BCAAA4',
    princesses: '#E91E63, #F06292, #F8BBD9',
    default: '#4A90E2, #6BB6FF, #90CAF9'
  };
  
  return gradients[theme.toLowerCase()] || gradients.default;
};

export const LetterHunt: React.FC<LetterHuntProps> = ({
  childName,
  targetLetter,
  childTheme,
  childAge,
  assets
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Preload all video and audio assets for better performance
  const preloadingHandle = useMemo(() => {
    const handle = delayRender('Preloading Letter Hunt assets');
    
    const preloadPromises = [];
    
    // Preload videos if they exist
    if (assets.introVideo?.url && assets.introVideo.status === 'ready') {
      preloadPromises.push(prefetch(assets.introVideo.url));
    }
    if (assets.intro2Video?.url && assets.intro2Video.status === 'ready') {
      preloadPromises.push(prefetch(assets.intro2Video.url));
    }
    if (assets.happyDanceVideo?.url && assets.happyDanceVideo.status === 'ready') {
      preloadPromises.push(prefetch(assets.happyDanceVideo.url));
    }
    
    // Preload audio files
    if (assets.backgroundMusic?.url && assets.backgroundMusic.status === 'ready') {
      preloadPromises.push(prefetch(assets.backgroundMusic.url));
    }
    if (assets.titleAudio?.url && assets.titleAudio.status === 'ready') {
      preloadPromises.push(prefetch(assets.titleAudio.url));
    }
    if (assets.introAudio?.url && assets.introAudio.status === 'ready') {
      preloadPromises.push(prefetch(assets.introAudio.url));
    }
    if (assets.intro2Audio?.url && assets.intro2Audio.status === 'ready') {
      preloadPromises.push(prefetch(assets.intro2Audio.url));
    }
    if (assets.signAudio?.url && assets.signAudio.status === 'ready') {
      preloadPromises.push(prefetch(assets.signAudio.url));
    }
    if (assets.bookAudio?.url && assets.bookAudio.status === 'ready') {
      preloadPromises.push(prefetch(assets.bookAudio.url));
    }
    if (assets.groceryAudio?.url && assets.groceryAudio.status === 'ready') {
      preloadPromises.push(prefetch(assets.groceryAudio.url));
    }
    if (assets.happyDanceAudio?.url && assets.happyDanceAudio.status === 'ready') {
      preloadPromises.push(prefetch(assets.happyDanceAudio.url));
    }
    if (assets.endingAudio?.url && assets.endingAudio.status === 'ready') {
      preloadPromises.push(prefetch(assets.endingAudio.url));
    }
    
    // Preload images for better performance (though Img component handles this well)
    if (assets.titleCard?.url && assets.titleCard.status === 'ready') {
      preloadPromises.push(prefetch(assets.titleCard.url));
    }
    if (assets.signImage?.url && assets.signImage.status === 'ready') {
      preloadPromises.push(prefetch(assets.signImage.url));
    }
    if (assets.bookImage?.url && assets.bookImage.status === 'ready') {
      preloadPromises.push(prefetch(assets.bookImage.url));
    }
    if (assets.groceryImage?.url && assets.groceryImage.status === 'ready') {
      preloadPromises.push(prefetch(assets.groceryImage.url));
    }
    if (assets.endingImage?.url && assets.endingImage.status === 'ready') {
      preloadPromises.push(prefetch(assets.endingImage.url));
    }
    
    if (preloadPromises.length > 0) {
      Promise.all(preloadPromises)
        .then(() => {
          console.log('✅ All Letter Hunt assets preloaded successfully');
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
  const standardDuration = 90; // 3 seconds * 30fps
  const introDuration = 165; // 5.5 seconds * 30fps (extended for intro audio)
  
  const segments = [
    { name: 'titleCard', start: 0, duration: standardDuration },
    { name: 'intro', start: standardDuration, duration: introDuration },
    { name: 'intro2', start: standardDuration + introDuration, duration: introDuration },
    { name: 'sign', start: standardDuration + introDuration + introDuration, duration: standardDuration },
    { name: 'book', start: standardDuration + introDuration + introDuration + standardDuration, duration: standardDuration },
    { name: 'grocery', start: standardDuration + introDuration + introDuration + standardDuration * 2, duration: standardDuration },
    { name: 'happyDance', start: standardDuration + introDuration + introDuration + standardDuration * 3, duration: standardDuration },
    { name: 'ending', start: standardDuration + introDuration + introDuration + standardDuration * 4, duration: standardDuration }
  ];

  // Find current segment
  const currentSegment = segments.find(
    segment => frame >= segment.start && frame < segment.start + segment.duration
  );

  // Animation helpers with improved transitions
  const fadeIn = (startFrame: number, duration: number = 15) => {
    return interpolate(
      frame,
      [startFrame, startFrame + duration],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  };

  const fadeOut = (endFrame: number, duration: number = 15) => {
    return interpolate(
      frame,
      [endFrame - duration, endFrame],
      [1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  };

  const crossFade = (startFrame: number, endFrame: number, fadeDuration: number = 15) => {
    if (frame < startFrame) return 0;
    if (frame > endFrame) return 0;
    
    // Fade in at start
    if (frame < startFrame + fadeDuration) {
      return interpolate(frame, [startFrame, startFrame + fadeDuration], [0, 1]);
    }
    
    // Fade out at end
    if (frame > endFrame - fadeDuration) {
      return interpolate(frame, [endFrame - fadeDuration, endFrame], [1, 0]);
    }
    
    // Full opacity in middle
    return 1;
  };

  const bounceIn = (startFrame: number) => {
    return spring({
      frame: frame - startFrame,
      fps,
      config: {
        damping: 8,
        stiffness: 100,
        mass: 0.5,
      },
    });
  };

  // Enhanced scale animation for videos with smooth entrance
  const videoScale = (startFrame: number, delayFrames: number = 10) => {
    return spring({
      frame: frame - startFrame - delayFrames,
      fps,
      config: {
        damping: 12,
        stiffness: 80,
        mass: 0.3,
      },
    });
  };

  // Theme-based background
  const backgroundStyle = {
    background: `linear-gradient(135deg, ${getThemeGradient(childTheme)})`,
    width: '100%',
    height: '100%'
  };

  return (
    <AbsoluteFill style={backgroundStyle}>
      
      {/* Background Music - plays throughout entire video */}
      {assets.backgroundMusic?.status === 'ready' && assets.backgroundMusic?.url && (
        <Audio 
          src={assets.backgroundMusic.url} 
          volume={0.3} 
          startFrom={0}
          endAt={durationInFrames}
        />
      )}
      
      {/* SEGMENT 1: Title Card */}
      <Sequence from={segments[0].start} durationInFrames={segments[0].duration}>
        <AbsoluteFill style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          opacity: crossFade(segments[0].start, segments[0].start + segments[0].duration)
        }}>
          {/* Title Card Image */}
          {assets.titleCard.status === 'ready' && assets.titleCard.url && (
            <Img 
              src={assets.titleCard.url} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${bounceIn(segments[0].start)})`
              }}
            />
          )}

          {/* Fallback Title Text */}
          {(!assets.titleCard.url || assets.titleCard.status !== 'ready') && (
            <div style={{
              fontSize: '120px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              padding: '40px',
              transform: `scale(${bounceIn(segments[0].start)})`
            }}>
              {childName}'s Letter Hunt!
            </div>
          )}
        </AbsoluteFill>
      </Sequence>

      {/* Title Audio - starts 1 second into title section, plays for up to 2 seconds */}
      {assets.titleAudio?.status === 'ready' && assets.titleAudio?.url && (
        <Sequence 
          from={segments[0].start + fps} // Start 1 second into title section
          durationInFrames={Math.min(segments[0].duration - fps, 2 * fps)} // Play for remaining title duration or 2 seconds max
        >
          <Audio 
            src={assets.titleAudio.url} 
            volume={(frame) => {
              const fadeFrames = fps * 0.3; // 0.3 second fade
              const sequenceDuration = Math.min(segments[0].duration - fps, 2 * fps);
              
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

      {/* SEGMENT 2: Intro Video */}
      <Sequence from={segments[1].start} durationInFrames={segments[1].duration}>
        <AbsoluteFill style={{ 
          opacity: crossFade(segments[1].start, segments[1].start + segments[1].duration)
        }}>
          {assets.introVideo.status === 'ready' && assets.introVideo.url ? (
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transform: `scale(${videoScale(segments[1].start, 10)})`,
              filter: 'brightness(1.05) contrast(1.1)', // Slight enhancement
            }}>
              <Video 
                src={assets.introVideo.url}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                volume={0.85}
                playbackRate={1.0}
              />
              {/* Subtle overlay for theme consistency */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `linear-gradient(45deg, ${getThemeGradient(childTheme).split(',')[0]} 0%, transparent 30%, transparent 70%, ${getThemeGradient(childTheme).split(',')[2]} 100%)`,
                opacity: 0.1,
                pointerEvents: 'none'
              }} />
            </div>
          ) : (
            <div style={{
              ...backgroundStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                fontSize: '80px',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
                padding: '40px',
                transform: `scale(${bounceIn(segments[1].start)})`
              }}>
                Today we're looking for the letter {targetLetter}!
              </div>
            </div>
          )}

          {/* Intro Audio - starts 1 second into intro segment */}
          {assets.introAudio.status === 'ready' && assets.introAudio.url && (
            <Sequence 
              from={fps} // Start 1 second into the intro segment
              durationInFrames={Math.min(introDuration - fps, 4 * fps)} // Play for remaining duration or 4 seconds max
            >
              <Audio 
                src={assets.introAudio.url} 
                volume={(frame) => {
                  const fadeFrames = fps * 0.2; // 0.2 second fade
                  const sequenceDuration = Math.min(introDuration - fps, 4 * fps);
                  
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

      {/* SEGMENT 3: Intro 2 Video */}
      <Sequence from={segments[2].start} durationInFrames={segments[2].duration}>
        <AbsoluteFill style={{ 
          opacity: crossFade(segments[2].start, segments[2].start + segments[2].duration)
        }}>
          {assets.intro2Video.status === 'ready' && assets.intro2Video.url ? (
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transform: `scale(${videoScale(segments[2].start, 10)})`,
              filter: 'brightness(1.05) contrast(1.1)',
            }}>
              <Video 
                src={assets.intro2Video.url}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                volume={0.85}
                playbackRate={1.0}
              />
              {/* Subtle theme overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `linear-gradient(45deg, ${getThemeGradient(childTheme).split(',')[0]} 0%, transparent 30%, transparent 70%, ${getThemeGradient(childTheme).split(',')[2]} 100%)`,
                opacity: 0.1,
                pointerEvents: 'none'
              }} />
            </div>
          ) : (
            <div style={{
              ...backgroundStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                fontSize: '80px',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
                padding: '40px'
              }}>
                Everywhere you go, look for the letter {targetLetter}!
              </div>
            </div>
          )}

          {/* Intro 2 Audio - starts 1 second into intro2 section, plays for up to 4.5 seconds */}
          {assets.intro2Audio?.status === 'ready' && assets.intro2Audio?.url && (
            <Sequence 
              from={fps} // Start 1 second into the intro2 segment
              durationInFrames={Math.min(segments[2].duration - fps, 4.5 * fps)} // Play for remaining duration or 4.5 seconds max
            >
              <Audio 
                src={assets.intro2Audio.url} 
                volume={(frame) => {
                  const fadeFrames = fps * 0.3; // 0.3 second fade
                  const sequenceDuration = Math.min(segments[2].duration - fps, 4.5 * fps);
                  
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



      {/* SEGMENT 3: On Signs */}
      <Sequence from={segments[3].start} durationInFrames={segments[3].duration}>
        <AbsoluteFill style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: crossFade(segments[3].start, segments[3].start + segments[3].duration)
        }}>
          {assets.signImage.status === 'ready' && assets.signImage.url ? (
            <Img 
              src={assets.signImage.url} 
              style={{
                width: '80%',
                height: '80%',
                objectFit: 'contain',
                transform: `scale(${bounceIn(segments[3].start)})`,
                filter: 'brightness(1.05) contrast(1.05)'
              }}
            />
          ) : (
            <div style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              padding: '40px',
              transform: `scale(${bounceIn(segments[3].start)})`
            }}>
              On signs
            </div>
          )}

          {/* Sign Audio */}
          {assets.signAudio.status === 'ready' && assets.signAudio.url && (
            <Audio 
              src={assets.signAudio.url} 
              volume={0.9}
            />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* SEGMENT 4: On Books */}
      <Sequence from={segments[4].start} durationInFrames={segments[4].duration}>
        <AbsoluteFill style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: crossFade(segments[4].start, segments[4].start + segments[4].duration)
        }}>
          {assets.bookImage.status === 'ready' && assets.bookImage.url ? (
            <Img 
              src={assets.bookImage.url} 
              style={{
                width: '80%',
                height: '80%',
                objectFit: 'contain',
                transform: `scale(${bounceIn(segments[4].start)})`,
                filter: 'brightness(1.05) contrast(1.05)'
              }}
            />
          ) : (
            <div style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              padding: '40px',
              transform: `scale(${bounceIn(segments[4].start)})`
            }}>
              On books
            </div>
          )}

          {/* Book Audio */}
          {assets.bookAudio.status === 'ready' && assets.bookAudio.url && (
            <Audio 
              src={assets.bookAudio.url} 
              volume={0.9}
            />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* SEGMENT 5: Grocery Store */}
      <Sequence from={segments[5].start} durationInFrames={segments[5].duration}>
        <AbsoluteFill style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: crossFade(segments[5].start, segments[5].start + segments[5].duration)
        }}>
          {assets.groceryImage.status === 'ready' && assets.groceryImage.url ? (
            <Img 
              src={assets.groceryImage.url} 
              style={{
                width: '80%',
                height: '80%',
                objectFit: 'contain',
                transform: `scale(${bounceIn(segments[5].start)})`,
                filter: 'brightness(1.05) contrast(1.05)'
              }}
            />
          ) : (
            <div style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              padding: '40px',
              transform: `scale(${bounceIn(segments[6].start)})`
            }}>
              Even in the grocery store!
            </div>
          )}

          {/* Grocery Audio */}
          {assets.groceryAudio.status === 'ready' && assets.groceryAudio.url && (
            <Audio 
              src={assets.groceryAudio.url} 
              volume={0.9}
            />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* SEGMENT 6: Happy Dance */}
      <Sequence from={segments[6].start} durationInFrames={segments[6].duration}>
        <AbsoluteFill style={{ 
          opacity: crossFade(segments[6].start, segments[6].start + segments[6].duration)
        }}>
          {assets.happyDanceVideo.status === 'ready' && assets.happyDanceVideo.url ? (
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transform: `scale(${videoScale(segments[6].start, 10)})`,
              filter: 'brightness(1.1) contrast(1.15) saturate(1.1)', // More vibrant for happy dance
            }}>
              <Video 
                src={assets.happyDanceVideo.url}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                volume={0.9}
                playbackRate={1.0}
              />
              {/* Celebratory overlay effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `radial-gradient(circle at center, transparent 40%, ${getThemeGradient(childTheme).split(',')[1].trim()} 80%)`,
                opacity: 0.15,
                pointerEvents: 'none'
              }} />
            </div>
          ) : (
            <div style={{
              ...backgroundStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                fontSize: '80px',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
                textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
                padding: '40px',
                transform: `scale(${bounceIn(segments[6].start)})`
              }}>
                And when you find your letter, I want you to do a little happy dance!
              </div>
            </div>
          )}

          {/* Happy Dance Audio */}
          {assets.happyDanceAudio.status === 'ready' && assets.happyDanceAudio.url && (
            <Audio 
              src={assets.happyDanceAudio.url} 
              volume={0.9}
            />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* SEGMENT 7: Ending */}
      <Sequence from={segments[7].start} durationInFrames={segments[7].duration}>
        <AbsoluteFill style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: crossFade(segments[7].start, segments[7].start + segments[7].duration)
        }}>
          {assets.endingImage.status === 'ready' && assets.endingImage.url ? (
            <Img 
              src={assets.endingImage.url} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${bounceIn(segments[7].start)})`,
                filter: 'brightness(1.05) contrast(1.05)'
              }}
            />
          ) : (
            <div style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
              padding: '40px',
              transform: `scale(${bounceIn(segments[7].start)})`
            }}>
              Have fun finding the letter {targetLetter}, {childName}!
            </div>
          )}

          {/* Ending Audio */}
          {assets.endingAudio.status === 'ready' && assets.endingAudio.url && (
            <Audio 
              src={assets.endingAudio.url} 
              volume={0.9}
            />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* Debug Info (bottom right corner) - Enhanced */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'monospace',
        maxWidth: '400px',
        lineHeight: '1.4'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4CAF50' }}>
          🎬 Letter Hunt Debug Info
        </div>
        <div>Frame: {frame} / {durationInFrames}</div>
        <div>Segment: {currentSegment?.name || 'none'} ({Math.ceil((frame % (currentSegment?.duration || standardDuration)) / fps * 10) / 10}s)</div>
        <div>Child: {childName} | Letter: {targetLetter} | Theme: {childTheme}</div>
        <div style={{ marginTop: '6px', fontSize: '12px', color: '#FFD700' }}>
          Videos: {[assets.introVideo, assets.intro2Video, assets.happyDanceVideo]
            .filter(v => v.status === 'ready').length}/3 ready
        </div>
        <div style={{ fontSize: '12px', color: '#FFD700' }}>
          Audio: {Object.values(assets)
            .filter(a => a.url && a.url.includes('audio')).length}/9 ready
        </div>
      </div>

      {/* Performance overlay for video loading status */}
      {(frame < 30) && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div style={{ color: '#4CAF50', fontWeight: 'bold', marginBottom: '6px' }}>
            📊 Asset Preload Status
          </div>
          {assets.introVideo.status === 'ready' && (
            <div style={{ color: '#4CAF50' }}>✅ Intro Video: Ready</div>
          )}
          {assets.intro2Video.status === 'ready' && (
            <div style={{ color: '#4CAF50' }}>✅ Search Video: Ready</div>
          )}
          {assets.happyDanceVideo.status === 'ready' && (
            <div style={{ color: '#4CAF50' }}>✅ Dance Video: Ready</div>
          )}
          {assets.backgroundMusic.status === 'ready' && (
            <div style={{ color: '#4CAF50' }}>✅ Background Music: Ready</div>
          )}
          {assets.titleAudio.status === 'ready' && (
            <div style={{ color: '#4CAF50' }}>✅ Title Audio: Ready</div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
