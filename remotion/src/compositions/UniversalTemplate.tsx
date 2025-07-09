import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface AudioElement {
  id: string;
  asset_id: string;
  volume: number;
  start_time: number;
  duration: number;
}

interface ImageElement {
  id: string;
  asset_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

interface VideoPart {
  id: string;
  name: string;
  type: 'intro' | 'slideshow' | 'outro' | 'custom';
  order: number;
  duration: number;
  audio_elements: AudioElement[];
  image_elements: ImageElement[];
}

interface GlobalElement {
  id: string;
  asset_id: string;
  type: 'audio' | 'image';
  purpose: string;
  volume?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
}

interface Template {
  id: string;
  name: string;
  template_type: string;
  global_elements: GlobalElement[];
  parts: VideoPart[];
}

interface Asset {
  id: string;
  type: 'audio' | 'image' | 'video';
  file_url: string;
  theme: string;
  metadata: any;
}

interface UniversalTemplateProps {
  childName: string;
  template: Template;
  assets: { [key: string]: Asset };
  theme?: string;
  age?: number;
}

export const UniversalTemplate: React.FC<UniversalTemplateProps> = ({
  childName,
  template,
  assets,
  theme = 'default',
  age = 3
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Calculate timing for each part
  const partTimings = template.parts.reduce((acc, part, index) => {
    const startFrame = acc.length > 0 ? acc[acc.length - 1].endFrame : 0;
    const endFrame = startFrame + (part.duration * fps);
    acc.push({
      ...part,
      startFrame,
      endFrame,
      frameIndex: index
    });
    return acc;
  }, [] as (VideoPart & { startFrame: number; endFrame: number; frameIndex: number })[]);

  // Find current part
  const currentPart = partTimings.find(part => 
    frame >= part.startFrame && frame < part.endFrame
  );

  // Get global audio elements
  const globalAudioElements = template.global_elements.filter(el => el.type === 'audio');
  const globalImageElements = template.global_elements.filter(el => el.type === 'image');

  // Render global image elements
  const renderGlobalImages = () => (
    <>
      {globalImageElements.map(element => {
        const asset = assets[element.asset_id];
        if (!asset || asset.type !== 'image') return null;

        return (
          <img
            key={element.id}
            src={asset.file_url}
            alt={`Global ${element.purpose}`}
            style={{
              position: 'absolute',
              left: element.x || 0,
              top: element.y || 0,
              width: element.width || '100%',
              height: element.height || '100%',
              opacity: element.opacity || 1,
              objectFit: 'cover',
              zIndex: 1
            }}
          />
        );
      })}
    </>
  );

  // Render current part
  const renderCurrentPart = () => {
    if (!currentPart) return null;

    const partFrame = frame - currentPart.startFrame;
    const partProgress = partFrame / (currentPart.duration * fps);

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Render part image elements */}
        {currentPart.image_elements.map(element => {
          const asset = assets[element.asset_id];
          if (!asset || asset.type !== 'image') return null;

          return (
            <img
              key={element.id}
              src={asset.file_url}
              alt={`Part ${currentPart.name} ${element.id}`}
              style={{
                position: 'absolute',
                left: element.x || 0,
                top: element.y || 0,
                width: element.width || 'auto',
                height: element.height || 'auto',
                opacity: element.opacity || 1,
                objectFit: 'contain',
                zIndex: 2
              }}
            />
          );
        })}

        {/* Render part-specific content based on type */}
        {currentPart.type === 'intro' && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 3,
            color: 'white',
            fontSize: 72,
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            {childName}'s {template.name}
          </div>
        )}

        {currentPart.type === 'slideshow' && (
          <div style={{
            position: 'absolute',
            bottom: 50,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            zIndex: 3,
            color: 'white',
            fontSize: 48,
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            {childName}'s Adventure
          </div>
        )}

        {currentPart.type === 'outro' && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 3,
            color: 'white',
            fontSize: 64,
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            Goodnight, {childName}! 🌙
          </div>
        )}
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme === 'halloween' ? '#1a1a2e' : '#87CEEB',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Global background images */}
      {renderGlobalImages()}

      {/* Current part content */}
      {renderCurrentPart()}

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: 10,
          fontSize: 12,
          zIndex: 10
        }}>
          Frame: {frame} | Part: {currentPart?.name || 'None'} | Progress: {Math.round((frame / durationInFrames) * 100)}%
        </div>
      )}
    </AbsoluteFill>
  );
}; 