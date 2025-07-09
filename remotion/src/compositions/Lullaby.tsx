// src/compositions/Lullaby.tsx

import React from 'react';
import { AbsoluteFill, useVideoConfig, Audio, Sequence, Img, interpolate, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

export interface LullabyProps {
  childName: string;
  childAge: number;
  childTheme: string;
  backgroundMusicUrl: string;
  backgroundMusicVolume?: number;
  duration?: number; // Duration in seconds from database metadata
  introImageUrl?: string; // Background image for intro
  outroImageUrl?: string; // Background image for outro
  slideshowImageUrls?: string[]; // Slideshow images for main section
  introAudioUrl?: string; // Personalized audio for intro
  debugMode?: boolean;
}

export const Lullaby: React.FC<LullabyProps> = ({
  childName,
  childAge,
  childTheme,
  backgroundMusicUrl,
  backgroundMusicVolume = 0.8,
  duration = 108, // Default to 108 seconds for local preview
  introImageUrl = '',
  outroImageUrl = '',
  slideshowImageUrls = [],
  introAudioUrl = '',
  debugMode = false,
}) => {
  const { fps, width } = useVideoConfig();
  
  // Calculate duration in frames based on audio length
  const durationInFrames = Math.round(duration * fps);
  
  // Part 1: Intro (5 seconds)
  const introDuration = 5 * fps; // 5 seconds
  
  // Part 3: Outro (5 seconds)
  const outroDuration = 5 * fps; // 5 seconds
  
  // Part 2: Main Content (slideshow)
  const mainContentDuration = durationInFrames - introDuration - outroDuration;
  
  // Slideshow configuration (from LullabyFresh)
  const secondsPerImage = 5;
  const framesPerImage = fps * secondsPerImage;
  const crossfadeFrames = fps * 1; // 1s fade
  
  // Calculate max number of images considering crossfade overlaps
  const framesPerImageWithOverlap = framesPerImage - crossfadeFrames;
  const maxImages = Math.floor(
    (mainContentDuration + crossfadeFrames) / framesPerImageWithOverlap
  );
  
  // Handle insufficient images with warning and fallback
  if (slideshowImageUrls.length < maxImages) {
    console.warn(
      `⚠️ Not enough images for full slideshow: have ${slideshowImageUrls.length}, need ${maxImages}. ` +
      `Will repeat images to fill the duration.`
    );
  }
  
  // Create images array that repeats if needed to fill the slideshow
  const imagesToUse = [];
  for (let i = 0; i < maxImages; i++) {
    if (slideshowImageUrls.length > 0) {
      imagesToUse.push(slideshowImageUrls[i % slideshowImageUrls.length]);
    }
  }
  
  // Ensure we have at least one image to prevent durationInFrames = 0
  if (imagesToUse.length === 0) {
    console.warn('⚠️ No slideshow images provided, using placeholder');
    imagesToUse.push('https://via.placeholder.com/1920x1080/1a1a1a/666666?text=No+Image+Available');
  }

  // Dynamic text sizing logic from LullabyFresh
  const introText = `Bedtime for ${childName}`;
  const outroText = `Goodnight, ${childName}`;
  const effectiveIntroTextLength = introText.length;
  const effectiveOutroTextLength = outroText.length - 11; // Remove "Goodnight, " prefix for calculation
  
  // More conservative scaling for longer names
  let introFontSize;
  if (effectiveIntroTextLength <= 5) {
    // Short names: generous sizing
    introFontSize = Math.min(280, Math.max(120, width / (introText.length * 0.5)));
  } else if (effectiveIntroTextLength <= 8) {
    // Medium names: moderate sizing
    introFontSize = Math.min(240, Math.max(100, width / (introText.length * 0.6)));
  } else if (effectiveIntroTextLength <= 11) {
    // Long names: conservative sizing
    introFontSize = Math.min(200, Math.max(80, width / (introText.length * 0.7)));
  } else {
    // Very long names: very conservative sizing
    introFontSize = Math.min(160, Math.max(60, width / (introText.length * 0.8)));
  }
  
  // Outro font sizing (accounting for "Goodnight, " prefix)
  let outroFontSize;
  if (effectiveOutroTextLength <= 5) {
    // Short names: generous sizing
    outroFontSize = Math.min(280, Math.max(120, width / (outroText.length * 0.5)));
  } else if (effectiveOutroTextLength <= 8) {
    // Medium names: moderate sizing
    outroFontSize = Math.min(240, Math.max(100, width / (outroText.length * 0.6)));
  } else if (effectiveOutroTextLength <= 11) {
    // Long names: conservative sizing
    outroFontSize = Math.min(200, Math.max(80, width / (outroText.length * 0.7)));
  } else {
    // Very long names: very conservative sizing
    outroFontSize = Math.min(160, Math.max(60, width / (outroText.length * 0.8)));
  }

  // Use DreamDrip asset URL from database
  // This will work for both local preview and Lambda deployment
  const dreamDripUrl = 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1751989180199.wav';
  // For remote, use backgroundMusicUrl if provided, otherwise use DreamDrip
  const musicSrc = backgroundMusicUrl || dreamDripUrl;

  // Debug logging (only when debug mode is enabled)
  if (debugMode) {
    console.log('🌙 Lullaby Debug Info:', {
      childName,
      childAge,
      childTheme,
      hasBackgroundMusic: !!musicSrc,
      backgroundMusicUrl: musicSrc,
      backgroundMusicVolume,
      duration,
      durationInFrames,
      introText,
      introFontSize,
      effectiveIntroTextLength,
      outroText,
      outroFontSize,
      effectiveOutroTextLength,
      hasIntroImage: !!introImageUrl,
      introImageUrl,
      hasOutroImage: !!outroImageUrl,
      outroImageUrl,
      slideshowImageCount: slideshowImageUrls.length,
      maxImages,
      imagesToUseCount: imagesToUse.length,
      hasIntroAudio: !!introAudioUrl,
      debugMode,
      slideshowMath: {
        mainContentDuration,
        framesPerImageWithOverlap,
        calculatedMaxImages: maxImages
      }
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Background Music - DreamDrip */}
      <Audio
        src={musicSrc}
        volume={backgroundMusicVolume}
        startFrom={0}
        endAt={durationInFrames}
        loop
      />
      
      {/* Debug Timestamp - Always visible */}
      <AbsoluteFill style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingBottom: '50px',
        pointerEvents: 'none',
        zIndex: 1000,
      }}>
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          fontSize: 48,
          fontFamily: 'monospace',
          fontWeight: 'bold',
          padding: '10px 20px',
          borderRadius: '10px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
        }}>
          {new Date().toLocaleTimeString()}
        </div>
      </AbsoluteFill>
      
      {/* Part 1: Intro (5 seconds) */}
      <Sequence from={0} durationInFrames={introDuration}>
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
          {/* Background Image */}
          {introImageUrl ? (
            <Img 
              src={introImageUrl} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0
              }} 
              alt="Intro background"
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'black',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#666',
              fontSize: 24
            }}>
              No Intro Image Available
            </div>
          )}
          
          {/* Personalized Text Overlay */}
          <AbsoluteFill style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: introFontSize,
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 1.2,
            padding: '0 5%',
            textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}>
            {introText}
          </AbsoluteFill>
          
          {/* Intro Audio */}
          {introAudioUrl && (
            <Audio src={introAudioUrl} volume={1.0} />
          )}
        </AbsoluteFill>
      </Sequence>
      
      {/* Part 2: Main Content (Slideshow) */}
      {imagesToUse.length > 0 && framesPerImage > 0 && (
        <Sequence from={introDuration} durationInFrames={imagesToUse.length * framesPerImage}>
          <Slideshow
            images={imagesToUse}
            secondsPerImage={secondsPerImage}
            crossfadeFrames={crossfadeFrames}
            debugMode={debugMode}
          />
        </Sequence>
      )}
      
      {/* Part 3: Outro (5 seconds) */}
      <Sequence from={introDuration + mainContentDuration} durationInFrames={outroDuration}>
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
          {/* Background Image */}
          {outroImageUrl ? (
            <Img 
              src={outroImageUrl} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0
              }} 
              alt="Outro background"
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'black',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#666',
              fontSize: 24
            }}>
              No Outro Image Available
            </div>
          )}

          {/* Personalized Text Overlay */}
          <AbsoluteFill style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: outroFontSize,
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 1.2,
            padding: '0 5%',
            textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}>
            {outroText}
          </AbsoluteFill>
          
          {/* Outro Audio */}
          {introAudioUrl && (
            <Audio src={introAudioUrl} volume={1.0} />
          )}
        </AbsoluteFill>
      </Sequence>
      
      {/* Debug overlay */}
      {debugMode && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          Lullaby Template
          <br />
          Child: {childName}
          <br />
          Age: {childAge}
          <br />
          Theme: {childTheme}
          <br />
          Duration: {duration}s ({durationInFrames} frames)
          <br />
          Intro: {introText} ({Math.round(introFontSize)}px)
          <br />
          Outro: {outroText} ({Math.round(outroFontSize)}px)
          <br />
          Main Content: {mainContentDuration} frames
          <br />
          Slideshow: {slideshowImageUrls.length} images → {imagesToUse.length} used
          <br />
          Background Music: {musicSrc ? '✅' : '❌'}
          {musicSrc && <br />}
          {musicSrc && <span style={{fontSize: '10px'}}>{musicSrc.split('/').pop()}</span>}
          <br />
          Intro Image: {introImageUrl ? '✅' : '❌'}
          <br />
          Intro Audio: {introAudioUrl ? '✅' : '❌'}
        </div>
      )}
    </AbsoluteFill>
  );
};

// 🔹 Slideshow Component with Fade & Ken Burns
const Slideshow: React.FC<{ 
  images: string[]; 
  secondsPerImage: number; 
  crossfadeFrames: number;
  debugMode?: boolean;
}> = ({ images, secondsPerImage, crossfadeFrames, debugMode = false }) => {
  const { fps } = useVideoConfig();
  const framesPerImage = fps * secondsPerImage;

  return (
    <TransitionSeries>
      {images.map((img, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={framesPerImage}>
            <KenBurnsImage 
              src={img} 
              durationInFrames={framesPerImage} 
              debugMode={debugMode}
              imageIndex={i}
            />
          </TransitionSeries.Sequence>
          {i < images.length - 1 && (
            <TransitionSeries.Transition
              presentation={fade()}
              timing={linearTiming({ durationInFrames: crossfadeFrames })}
            />
          )}
        </React.Fragment>
      ))}
    </TransitionSeries>
  );
};

// 🔹 Ken Burns Effect
const KenBurnsImage: React.FC<{ 
  src: string; 
  durationInFrames: number;
  debugMode?: boolean;
  imageIndex?: number;
}> = ({ src, durationInFrames, debugMode = false, imageIndex = 0 }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, durationInFrames], [0, -30], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translateY(${translateY}px)`,
        }}
      />
      
      {/* Debug overlay */}
      {debugMode && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          Slideshow {imageIndex + 1}: {src.split('/').pop()}
          {src ? ' ✅' : ' ❌'}
        </div>
      )}
    </AbsoluteFill>
  );
}; 