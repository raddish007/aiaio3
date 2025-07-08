import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface LullabyFreshProps {
  childName: string;
  introAudioUrl: string;
  outroAudioUrl: string;
  lullabySongUrl: string;
  lullabySongVolume?: number;
  introImage: string;
  outroImage: string;
  slideshowImages: string[];
  debugMode?: boolean;
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
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleDuration = fps * 5; // 5s
  const introAudioDuration = fps * 4; // 4s
  const outroAudioDuration = fps * 4; // 4s
  const secondsPerImage = 5;
  const framesPerImage = fps * secondsPerImage;

  const totalVideoFrames = fps * 106.5; // cut at 1:46.5
  const outroStart = fps * 102; // outro at 1:42
  const slideshowStart = titleDuration + introAudioDuration;

  // Calculate max number of images
  const availableSlideshowFrames = outroStart - slideshowStart;
  const maxImages = Math.floor(availableSlideshowFrames / framesPerImage);

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
      debugMode
    });
  }

  // Determine which segment to show based on current frame
  let currentSegment = 'intro';
  let currentImageIndex = 0;
  let currentImage = introImage;
  let currentText = `Bedtime for ${childName}`;

  if (frame >= slideshowStart && frame < outroStart) {
    currentSegment = 'slideshow';
    const slideshowFrame = frame - slideshowStart;
    currentImageIndex = Math.floor(slideshowFrame / framesPerImage);
    if (imagesToUse.length > 0) {
      currentImage = imagesToUse[currentImageIndex % imagesToUse.length];
    }
    currentText = '';
  } else if (frame >= outroStart) {
    currentSegment = 'outro';
    currentImage = outroImage;
    currentText = `Goodnight, ${childName}`;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Background Image */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: currentImage ? `url(${currentImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }} />

      {/* Text Overlay */}
      {currentText && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: 72,
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: 1.2,
          padding: '0 5%',
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}>
          {currentText}
        </div>
      )}

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
          {currentSegment}: {currentText}
          {currentImage ? ' ✅' : ' ❌'}
          {currentImage && <br />}
          {currentImage && <span style={{fontSize: '10px'}}>{currentImage.split('/').pop()}</span>}
          <br />
          <span style={{fontSize: '10px'}}>Frame: {frame}, Segment: {currentSegment}</span>
        </div>
      )}

      {/* Fade to black at the end */}
      {frame > totalVideoFrames - fps * 2 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
          opacity: interpolate(
            frame,
            [totalVideoFrames - fps * 2, totalVideoFrames],
            [0, 1],
            { extrapolateRight: 'clamp' }
          )
        }} />
      )}
    </AbsoluteFill>
  );
}; 