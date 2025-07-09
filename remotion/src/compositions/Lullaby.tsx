// src/compositions/Lullaby.tsx

import React from 'react';
import { AbsoluteFill, useVideoConfig, Audio } from 'remotion';

export interface LullabyProps {
  childName: string;
  childAge: number;
  childTheme: string;
  backgroundMusicUrl: string;
  backgroundMusicVolume?: number;
  duration?: number; // Duration in seconds from database metadata
  debugMode?: boolean;
}

export const Lullaby: React.FC<LullabyProps> = ({
  childName,
  childAge,
  childTheme,
  backgroundMusicUrl,
  backgroundMusicVolume = 0.8,
  duration = 108, // Default to 108 seconds for local preview
  debugMode = false,
}) => {
  const { fps } = useVideoConfig();
  
  // Calculate duration in frames based on audio length
  const durationInFrames = Math.round(duration * fps);

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
      debugMode,
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
      {/* Basic structure - we'll add components step by step */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: 48,
        fontFamily: 'Poppins, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        gap: '20px',
      }}>
        <div>Lullaby for {childName}</div>
        <div style={{ fontSize: 32, fontWeight: 'normal' }}>
          Age: {childAge} | Theme: {childTheme}
        </div>
      </div>
      
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
          Background Music: {musicSrc ? '✅' : '❌'}
          {musicSrc && <br />}
          {musicSrc && <span style={{fontSize: '10px'}}>{musicSrc.split('/').pop()}</span>}
        </div>
      )}
    </AbsoluteFill>
  );
}; 