import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Audio, useVideoConfig } from 'remotion';

interface HelloWorldWithAudioProps {
  backgroundMusicUrl?: string;
  backgroundMusicVolume?: number;
}

export const HelloWorldWithAudio: React.FC<HelloWorldWithAudioProps> = ({
  backgroundMusicUrl = '',
  backgroundMusicVolume = 0.25
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Simple fade in animation
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  
  // Video duration: 6 seconds
  const duration6Sec = fps * 6;
  
  // Log what we received
  console.log('🎵 HelloWorldWithAudio received:', {
    backgroundMusic: backgroundMusicUrl,
    volume: backgroundMusicVolume,
    hasUrl: !!backgroundMusicUrl
  });
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#2E8B57' }}>
      
      {/* Background Music ONLY - ULTRA SIMPLE */}
      {backgroundMusicUrl && backgroundMusicUrl.trim() !== '' && (
        <Audio 
          src={backgroundMusicUrl}
          volume={backgroundMusicVolume}
        />
      )}
      
      {/* Visual Indicators */}
      <AbsoluteFill style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
      }}>
        
        {/* Main Title */}
        <div style={{
          fontSize: 80,
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
          opacity,
          textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
          marginBottom: '40px'
        }}>
          Background Music Test
        </div>
        
        {/* Audio Status */}
        <div style={{
          fontSize: 32,
          color: 'white',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          marginBottom: '20px'
        }}>
          {backgroundMusicUrl ? '✅ Background Music Should Be Playing' : '❌ No Background Music URL'}
        </div>
        
        {/* Volume Indicator */}
        {backgroundMusicUrl && (
          <div style={{
            fontSize: 24,
            color: 'lime',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          }}>
            🔊 Volume: {backgroundMusicVolume}
          </div>
        )}
        
        {/* Debug Info */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          fontSize: '16px',
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          textAlign: 'left'
        }}>
          <div><strong>Frame:</strong> {frame}</div>
          <div><strong>Background Music:</strong> {backgroundMusicUrl ? '✅' : '❌'}</div>
          <div><strong>Volume:</strong> {backgroundMusicVolume}</div>
          <div><strong>Duration:</strong> {duration6Sec / fps}s</div>
          <div><strong>URL:</strong> {backgroundMusicUrl || 'None'}</div>
        </div>
        
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

