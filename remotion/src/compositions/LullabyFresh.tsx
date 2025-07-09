// src/compositions/LullabyFresh.tsx

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  Img,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  interpolate,
} from 'remotion';

import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

export interface LullabyFreshProps {
  childName: string;
  introAudioUrl: string;
  outroAudioUrl: string;
  lullabySongUrl: string;
  lullabySongVolume?: number;
  introImage: string;
  outroImage: string;
  slideshowImages: string[];
  debugMode?: boolean; // Add debug mode prop
}

export const LullabyFresh: React.FC<LullabyFreshProps> = ({
  childName,
  introAudioUrl,
  outroAudioUrl,
  lullabySongUrl,
  lullabySongVolume = 0.8,
  introImage,
  outroImage,
  slideshowImages,
  debugMode = false,
}) => {
  const { fps } = useVideoConfig();

  const titleDuration = fps * 5; // 5s
  const introAudioDuration = fps * 4; // 4s
  const outroAudioDuration = fps * 4; // 4s
  const secondsPerImage = 5;
  const framesPerImage = fps * secondsPerImage;
  const crossfadeFrames = fps * 1; // 1s fade

  const totalVideoFrames = fps * 106.5; // cut at 1:46.5
  const outroStart = fps * 102; // outro at 1:42

  const slideshowStart = titleDuration + introAudioDuration;

  // Calculate max number of images considering crossfade overlaps
  const availableSlideshowFrames = outroStart - slideshowStart;
  const framesPerImageWithOverlap = framesPerImage - crossfadeFrames;
  const maxImages = Math.floor(
    (availableSlideshowFrames + crossfadeFrames) / framesPerImageWithOverlap
  );

  // Handle insufficient images with warning and fallback
  if (slideshowImages.length < maxImages) {
    console.warn(
      `⚠️ Not enough images for full slideshow: have ${slideshowImages.length}, need ${maxImages}. ` +
      `Will repeat images to fill the duration.`
    );
  }

  // Create images array that repeats if needed to fill the slideshow
  const imagesToUse = [];
  for (let i = 0; i < maxImages; i++) {
    if (slideshowImages.length > 0) {
      imagesToUse.push(slideshowImages[i % slideshowImages.length]);
    }
  }

  // Debug logging (only when debug mode is enabled)
  if (debugMode) {
    console.log('🌙 LullabyFresh Debug Info:', {
      childName,
      hasIntroAudio: !!introAudioUrl,
      hasOutroAudio: !!outroAudioUrl,
      hasBackgroundMusic: !!lullabySongUrl,
      backgroundMusicUrl: lullabySongUrl,
      backgroundMusicVolume: lullabySongVolume,
      hasIntroImage: !!introImage,
      introImageUrl: introImage,
      hasOutroImage: !!outroImage,
      outroImageUrl: outroImage,
      slideshowImageCount: slideshowImages.length,
      maxImages,
      imagesToUseCount: imagesToUse.length,
      debugMode,
      imageMath: {
        availableSlideshowFrames,
        framesPerImageWithOverlap,
        calculatedMaxImages: maxImages
      }
    });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* 🎵 Background music */}
      <Audio
        src={lullabySongUrl}
        volume={lullabySongVolume}
      />

      {/* 💤 Intro */}
      <Sequence from={0} durationInFrames={slideshowStart}>
        <IntroOutroImage
          image={introImage}
          text={`Bedtime for ${childName}`}
          debugMode={debugMode}
          segmentName="Intro"
        />
      </Sequence>

      {/* 🗣️ Intro audio */}
      <Sequence from={titleDuration} durationInFrames={introAudioDuration}>
        <Audio src={introAudioUrl} volume={1.0} />
      </Sequence>

      {/* 🖼️ Slideshow */}
      <Sequence from={slideshowStart} durationInFrames={imagesToUse.length * framesPerImage}>
        <Slideshow
          images={imagesToUse}
          secondsPerImage={secondsPerImage}
          crossfadeFrames={crossfadeFrames}
          debugMode={debugMode}
        />
      </Sequence>

      {/* 🌙 Outro */}
      <Sequence from={outroStart} durationInFrames={outroAudioDuration}>
        <IntroOutroImage
          image={outroImage}
          text={`Goodnight, ${childName}`}
          debugMode={debugMode}
          segmentName="Outro"
        />
        <Audio src={outroAudioUrl} volume={1.0} />
      </Sequence>

      {/* 🚪 Fade to black */}
      <Sequence from={totalVideoFrames - fps * 2} durationInFrames={fps * 2}>
        <FadeToBlack />
      </Sequence>
    </AbsoluteFill>
  );
};

// 🔹 Intro/Outro Image Component
const IntroOutroImage: React.FC<{ 
  image: string; 
  text: string; 
  debugMode?: boolean;
  segmentName?: string;
}> = ({ image, text, debugMode = false, segmentName = "Segment" }) => {
  const { width } = useVideoConfig();
  
  // Improved font size calculation for longer names
  // Account for "Goodnight, " prefix (11 characters) in outro text
  const isOutro = text.startsWith('Goodnight, ');
  const effectiveTextLength = isOutro ? text.length - 11 : text.length; // Remove "Goodnight, " prefix for calculation
  
  // More conservative scaling for longer names
  let baseFontSize;
  if (effectiveTextLength <= 5) {
    // Short names: generous sizing
    baseFontSize = Math.min(280, Math.max(120, width / (text.length * 0.5)));
  } else if (effectiveTextLength <= 8) {
    // Medium names: moderate sizing
    baseFontSize = Math.min(240, Math.max(100, width / (text.length * 0.6)));
  } else if (effectiveTextLength <= 11) {
    // Long names: conservative sizing
    baseFontSize = Math.min(200, Math.max(80, width / (text.length * 0.7)));
  } else {
    // Very long names: very conservative sizing
    baseFontSize = Math.min(160, Math.max(60, width / (text.length * 0.8)));
  }

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <AbsoluteFill style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: baseFontSize,
        fontFamily: 'Poppins, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 1.2,
        padding: '0 5%',
        textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}>
        {text}
      </AbsoluteFill>
      
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
          {segmentName}: {text}
          {image ? ' ✅' : ' ❌'}
          {image && <br />}
          {image && <span style={{fontSize: '10px'}}>{image.split('/').pop()}</span>}
          <br />
          <span style={{fontSize: '10px'}}>Font: {Math.round(baseFontSize)}px, Length: {text.length}, Effective: {effectiveTextLength}</span>
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

// 🔹 Fade to Black
const FadeToBlack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, fps * 2], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: 'black', opacity }} />
  );
}; 