import React, { useMemo } from 'react';
import {
  AbsoluteFill, 
  Sequence, 
  useVideoConfig, 
  useCurrentFrame,
  spring,
  interpolate,
  Img,
  Audio,
  Video
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

  // Define segment durations (all 3 seconds each at 30fps = 90 frames)
  const segmentDuration = 90; // 3 seconds * 30fps
  
  const segments = [
    { name: 'titleCard', start: 0, duration: segmentDuration },
    { name: 'intro', start: segmentDuration, duration: segmentDuration },
    { name: 'intro2', start: segmentDuration * 2, duration: segmentDuration },
    { name: 'sign', start: segmentDuration * 3, duration: segmentDuration },
    { name: 'book', start: segmentDuration * 4, duration: segmentDuration },
    { name: 'grocery', start: segmentDuration * 5, duration: segmentDuration },
    { name: 'happyDance', start: segmentDuration * 6, duration: segmentDuration },
    { name: 'ending', start: segmentDuration * 7, duration: segmentDuration }
  ];

  // Find current segment
  const currentSegment = segments.find(
    segment => frame >= segment.start && frame < segment.start + segment.duration
  );

  // Animation helpers
  const fadeIn = (startFrame: number, duration: number = 15) => {
    return interpolate(
      frame,
      [startFrame, startFrame + duration],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
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
          opacity: fadeIn(segments[0].start)
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
        <AbsoluteFill style={{ opacity: fadeIn(segments[1].start) }}>
          {assets.introVideo.status === 'ready' && assets.introVideo.url ? (
            <Video 
              src={assets.introVideo.url}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
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
                Today we're looking for the letter {targetLetter}!
              </div>
            </div>
          )}

          {/* Intro Audio */}
          {assets.introAudio.status === 'ready' && assets.introAudio.url && (
            <Audio src={assets.introAudio.url} />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* SEGMENT 3: Intro 2 Video */}
      <Sequence from={segments[2].start} durationInFrames={segments[2].duration}>
        <AbsoluteFill style={{ opacity: fadeIn(segments[2].start) }}>
          {assets.intro2Video.status === 'ready' && assets.intro2Video.url ? (
            <Video 
              src={assets.intro2Video.url}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
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

          {/* Intro 2 Audio */}
          {assets.intro2Audio.status === 'ready' && assets.intro2Audio.url && (
            <Audio src={assets.intro2Audio.url} />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* SEGMENT 4: On Signs */}
      <Sequence from={segments[3].start} durationInFrames={segments[3].duration}>
        <AbsoluteFill style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: fadeIn(segments[3].start)
        }}>
          {assets.signImage.status === 'ready' && assets.signImage.url ? (
            <Img 
              src={assets.signImage.url} 
              style={{
                width: '80%',
                height: '80%',
                objectFit: 'contain',
                transform: `scale(${bounceIn(segments[3].start)})`
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
            <Audio src={assets.signAudio.url} />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* SEGMENT 5: On Books */}
      <Sequence from={segments[4].start} durationInFrames={segments[4].duration}>
        <AbsoluteFill style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: fadeIn(segments[4].start)
        }}>
          {assets.bookImage.status === 'ready' && assets.bookImage.url ? (
            <Img 
              src={assets.bookImage.url} 
              style={{
                width: '80%',
                height: '80%',
                objectFit: 'contain',
                transform: `scale(${bounceIn(segments[4].start)})`
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
            <Audio src={assets.bookAudio.url} />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* SEGMENT 6: Grocery Store */}
      <Sequence from={segments[5].start} durationInFrames={segments[5].duration}>
        <AbsoluteFill style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: fadeIn(segments[5].start)
        }}>
          {assets.groceryImage.status === 'ready' && assets.groceryImage.url ? (
            <Img 
              src={assets.groceryImage.url} 
              style={{
                width: '80%',
                height: '80%',
                objectFit: 'contain',
                transform: `scale(${bounceIn(segments[5].start)})`
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
              transform: `scale(${bounceIn(segments[5].start)})`
            }}>
              Even in the grocery store!
            </div>
          )}

          {/* Grocery Audio */}
          {assets.groceryAudio.status === 'ready' && assets.groceryAudio.url && (
            <Audio src={assets.groceryAudio.url} />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* SEGMENT 7: Happy Dance */}
      <Sequence from={segments[6].start} durationInFrames={segments[6].duration}>
        <AbsoluteFill style={{ opacity: fadeIn(segments[6].start) }}>
          {assets.happyDanceVideo.status === 'ready' && assets.happyDanceVideo.url ? (
            <Video 
              src={assets.happyDanceVideo.url}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
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
                And when you find your letter, I want you to do a little happy dance!
              </div>
            </div>
          )}

          {/* Happy Dance Audio */}
          {assets.happyDanceAudio.status === 'ready' && assets.happyDanceAudio.url && (
            <Audio src={assets.happyDanceAudio.url} />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* SEGMENT 8: Ending */}
      <Sequence from={segments[7].start} durationInFrames={segments[7].duration}>
        <AbsoluteFill style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: fadeIn(segments[7].start)
        }}>
          {assets.endingImage.status === 'ready' && assets.endingImage.url ? (
            <Img 
              src={assets.endingImage.url} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${bounceIn(segments[7].start)})`
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
            <Audio src={assets.endingAudio.url} />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* Debug Info (bottom right corner) */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '16px',
        fontFamily: 'monospace'
      }}>
        Frame: {frame} | Segment: {currentSegment?.name || 'none'} | {childName} | Letter: {targetLetter}
      </div>
    </AbsoluteFill>
  );
};
