import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface TemplateVideoProps {
  childName: string;
  template: {
    id: string;
    name: string;
    template_type: string;
    global_elements: Array<{
      id: string;
      type: 'audio' | 'image';
      asset_purpose: string;
      description: string;
      required: boolean;
      asset_type: 'class' | 'specific';
      asset_class?: string;
      specific_asset_id?: string;
      specific_asset_name?: string;
    }>;
    parts: Array<{
      id: string;
      name: string;
      type: 'intro' | 'slideshow' | 'outro' | 'custom';
      order: number;
      duration: number;
      audio_elements: Array<{
        id: string;
        asset_purpose: string;
        description: string;
        required: boolean;
        asset_type: 'class' | 'specific';
        asset_class?: string;
        specific_asset_id?: string;
        specific_asset_name?: string;
      }>;
      image_elements: Array<{
        id: string;
        asset_purpose: string;
        description: string;
        safe_zone: string;
        required: boolean;
        asset_type: 'class' | 'specific';
        asset_class?: string;
        specific_asset_id?: string;
        specific_asset_name?: string;
      }>;
    }>;
  };
  assets: {
    [assetId: string]: {
      id: string;
      type: 'audio' | 'image';
      theme: string;
      file_url: string;
      tags?: string[];
      metadata?: any;
    };
  };
}

export const TemplateVideo: React.FC<TemplateVideoProps> = ({ 
  childName, 
  template, 
  assets 
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate total duration and part timings
  const totalDuration = template.parts.reduce((total, part) => total + part.duration, 0);
  const totalFrames = totalDuration * fps;

  // Find current part based on frame
  let currentPartIndex = 0;
  let currentPartFrame = frame;
  let accumulatedFrames = 0;

  for (let i = 0; i < template.parts.length; i++) {
    const part = template.parts[i];
    const partFrames = part.duration * fps;
    
    if (frame < accumulatedFrames + partFrames) {
      currentPartIndex = i;
      currentPartFrame = frame - accumulatedFrames;
      break;
    }
    
    accumulatedFrames += partFrames;
  }

  const currentPart = template.parts[currentPartIndex];

  // Get assets for current part
  const getPartAssets = () => {
    const partAssets: {
      audio: Array<{ id: string; url: string; purpose: string }>;
      images: Array<{ id: string; url: string; purpose: string; safeZone: string }>;
    } = { audio: [], images: [] };

    // Add global audio assets
    template.global_elements
      .filter(el => el.type === 'audio')
      .forEach(el => {
        if (el.asset_type === 'specific' && el.specific_asset_id && assets[el.specific_asset_id]) {
          partAssets.audio.push({
            id: el.id,
            url: assets[el.specific_asset_id].file_url,
            purpose: el.asset_purpose
          });
        }
      });

    // Add part-specific audio assets
    currentPart.audio_elements.forEach(el => {
      if (el.asset_type === 'specific' && el.specific_asset_id && assets[el.specific_asset_id]) {
        partAssets.audio.push({
          id: el.id,
          url: assets[el.specific_asset_id].file_url,
          purpose: el.asset_purpose
        });
      }
    });

    // Add part-specific image assets
    currentPart.image_elements.forEach(el => {
      if (el.asset_type === 'specific' && el.specific_asset_id && assets[el.specific_asset_id]) {
        partAssets.images.push({
          id: el.id,
          url: assets[el.specific_asset_id].file_url,
          purpose: el.asset_purpose,
          safeZone: el.safe_zone
        });
      }
    });

    return partAssets;
  };

  const partAssets = getPartAssets();

  // Get theme colors based on template type
  const getThemeColors = () => {
    switch (template.template_type) {
      case 'lullaby':
        return {
          background: '#1a1a2e',
          primary: '#FF6B35',
          secondary: '#FFD700',
          text: '#FFFFFF',
          accent: '#FF4500'
        };
      case 'name-video':
        return {
          background: '#87CEEB',
          primary: '#2E8B57',
          secondary: '#4169E1',
          text: '#000000',
          accent: '#FF4500'
        };
      case 'letter-hunt':
        return {
          background: '#98FB98',
          primary: '#32CD32',
          secondary: '#FFD700',
          text: '#000000',
          accent: '#FF6347'
        };
      default:
        return {
          background: '#87CEEB',
          primary: '#2E8B57',
          secondary: '#4169E1',
          text: '#000000',
          accent: '#FF4500'
        };
    }
  };

  const colors = getThemeColors();

  // Get background image for current part
  const getBackgroundImage = () => {
    const backgroundImage = partAssets.images.find(img => 
      img.purpose.includes('background') || img.purpose.includes('bg')
    );
    return backgroundImage?.url || '';
  };

  // Get safe zone positioning
  const getSafeZonePosition = (safeZone: string) => {
    switch (safeZone) {
      case 'left_safe':
        return { left: '40%', right: '0%', top: '0%', bottom: '0%' };
      case 'right_safe':
        return { left: '0%', right: '40%', top: '0%', bottom: '0%' };
      case 'center_safe':
        return { left: '20%', right: '20%', top: '20%', bottom: '20%' };
      case 'intro_safe':
        return { left: '10%', right: '10%', top: '10%', bottom: '10%' };
      case 'outro_safe':
        return { left: '10%', right: '10%', top: '10%', bottom: '10%' };
      default:
        return { left: '0%', right: '0%', top: '0%', bottom: '0%' };
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {/* Background Image */}
      {getBackgroundImage() && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${getBackgroundImage()})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.8
          }}
        />
      )}

      {/* Audio Elements */}
      {partAssets.audio.map((audio, index) => (
        <audio
          key={audio.id}
          src={audio.url}
          autoPlay={index === 0} // Only autoplay first audio
          loop={audio.purpose.includes('background')}
        />
      ))}

      {/* Part-specific content */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {currentPart.type === 'intro' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: colors.text,
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                marginBottom: '20px',
                opacity: interpolate(currentPartFrame, [0, 60], [0, 1]),
                transform: `scale(${interpolate(currentPartFrame, [0, 60], [0.8, 1])})`
              }}
            >
              {template.name}
            </h1>
            <p
              style={{
                fontSize: '36px',
                opacity: interpolate(currentPartFrame, [30, 90], [0, 1])
              }}
            >
              For {childName}
            </p>
          </div>
        )}

        {currentPart.type === 'slideshow' && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {partAssets.images
              .filter(img => !img.purpose.includes('background'))
              .map((image, index) => {
                const imageDuration = (currentPart.duration * fps) / partAssets.images.length;
                const imageStartFrame = index * imageDuration;
                const imageEndFrame = (index + 1) * imageDuration;
                
                if (currentPartFrame >= imageStartFrame && currentPartFrame < imageEndFrame) {
                  const safeZone = getSafeZonePosition(image.safeZone);
                  return (
                    <div
                      key={image.id}
                      style={{
                        position: 'absolute',
                        ...safeZone,
                        opacity: interpolate(
                          currentPartFrame - imageStartFrame,
                          [0, 30, imageDuration - 30, imageDuration],
                          [0, 1, 1, 0]
                        )
                      }}
                    >
                      <img
                        src={image.url}
                        alt={image.purpose}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  );
                }
                return null;
              })}
          </div>
        )}

        {currentPart.type === 'outro' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: colors.text,
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                marginBottom: '20px',
                opacity: interpolate(
                  currentPartFrame,
                  [0, currentPart.duration * fps - 60],
                  [1, 1]
                )
              }}
            >
              Thanks for watching!
            </h1>
            <p
              style={{
                fontSize: '36px',
                opacity: interpolate(
                  currentPartFrame,
                  [30, currentPart.duration * fps - 30],
                  [0, 1]
                )
              }}
            >
              Goodbye, {childName}!
            </p>
          </div>
        )}

        {/* Progress indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '4px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: '2px'
          }}
        >
          <div
            style={{
              width: `${(frame / totalFrames) * 100}%`,
              height: '100%',
              backgroundColor: colors.primary,
              borderRadius: '2px',
              transition: 'width 0.1s ease'
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}; 