import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Img, Audio, useVideoConfig } from 'remotion';

interface HelloWorldWithImageAndAudioProps {
  backgroundImageUrl?: string;
  backgroundMusicUrl?: string;
  backgroundMusicVolume?: number;
  letterAudioUrl?: string;
  letterName?: string;
}

export const HelloWorldWithImageAndAudio: React.FC<HelloWorldWithImageAndAudioProps> = ({
  backgroundImageUrl = 'https://picsum.photos/1920/1080', // fallback
  backgroundMusicUrl = '',
  backgroundMusicVolume = 0.25,
  letterAudioUrl = '',
  letterName = ''
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Simple fade in animation
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  const scale = interpolate(frame, [0, 30], [0.8, 1]);
  
  // Log what we received
  console.log('🎵 HelloWorldWithImageAndAudio received:', {
    backgroundImage: backgroundImageUrl,
    backgroundMusic: backgroundMusicUrl,
    volume: backgroundMusicVolume,
    hasMusic: !!backgroundMusicUrl,
    letterAudio: letterAudioUrl,
    letterName: letterName,
    hasLetterAudio: !!letterAudioUrl
  });
  
  return (
    <AbsoluteFill>
      {/* Background Music */}
      {backgroundMusicUrl && backgroundMusicUrl.trim() !== '' && (
        <Audio 
          src={backgroundMusicUrl}
          volume={backgroundMusicVolume}
        />
      )}
      
      {/* Letter Audio - Play immediately for testing */}
      {letterAudioUrl && letterAudioUrl.trim() !== '' && (
        <Audio 
          src={letterAudioUrl}
          volume={1.0}
          // startFrom={fps * 5} // Start at 5 seconds - commented out for testing
        />
      )}
      
      {/* Background Image */}
      <Img
        src={backgroundImageUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      
      {/* Hello World Text Overlay */}
      <AbsoluteFill
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            opacity,
            transform: `scale(${scale})`,
            textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '20px 40px',
            borderRadius: '20px',
          }}
        >
          Hello World!
        </div>
      </AbsoluteFill>
      
      {/* Audio Status Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          fontSize: '16px',
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          textAlign: 'left'
        }}
      >
        <div><strong>🎵 Background Music:</strong> {backgroundMusicUrl ? '✅' : '❌'}</div>
        <div><strong>🔤 Letter Audio:</strong> {letterAudioUrl ? '✅' : '❌'}</div>
        {letterAudioUrl && <div><strong>Letter:</strong> {letterName}</div>}
        <div><strong>Volume:</strong> {backgroundMusicVolume}</div>
        <div><strong>Frame:</strong> {frame}</div>
        <div><strong>Time:</strong> {(frame / fps).toFixed(1)}s</div>
      </div>
    </AbsoluteFill>
  );
}; 