import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const HelloWorld: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Simple fade in animation
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  const scale = interpolate(frame, [0, 30], [0.8, 1]);
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#87CEEB',
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
          color: '#2E8B57',
          textAlign: 'center',
          opacity,
          transform: `scale(${scale})`,
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        Hello World!
      </div>
    </AbsoluteFill>
  );
}; 