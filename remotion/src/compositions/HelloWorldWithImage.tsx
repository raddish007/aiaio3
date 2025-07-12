import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Img } from 'remotion';

interface HelloWorldWithImageProps {
  backgroundImageUrl?: string;
}

export const HelloWorldWithImage: React.FC<HelloWorldWithImageProps> = ({
  backgroundImageUrl = 'https://picsum.photos/1920/1080' // fallback
}) => {
  const frame = useCurrentFrame();
  
  // Simple fade in animation
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  const scale = interpolate(frame, [0, 30], [0.8, 1]);
  
  return (
    <AbsoluteFill>
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
    </AbsoluteFill>
  );
}; 