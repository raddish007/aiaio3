import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

interface NameVideoProps {
  childName: string;
  theme: string;
  age: number;
}

export const NameVideo: React.FC<NameVideoProps> = ({ childName, theme, age }) => {
  const frame = useCurrentFrame();
  
  // Animation timing
  const letterDuration = 30; // frames per letter
  const totalLetters = childName.length;
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme === 'halloween' ? '#1a1a2e' : '#87CEEB',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Background decoration based on theme */}
      {theme === 'halloween' && (
        <div style={{ position: 'absolute', top: 20, left: 20, fontSize: 48 }}>
          🎃
        </div>
      )}
      
      {/* Main title */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 'bold',
          color: theme === 'halloween' ? '#FF6B35' : '#2E8B57',
          marginBottom: 40,
          textAlign: 'center',
        }}
      >
        {childName}'s Name Video!
      </div>
      
      {/* Letter display */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
        {childName.split('').map((letter, index) => {
          const letterFrame = frame - (index * letterDuration);
          const opacity = interpolate(
            letterFrame,
            [0, 10, letterDuration - 10, letterDuration],
            [0, 1, 1, 0]
          );
          const scale = interpolate(
            letterFrame,
            [0, 10, letterDuration - 10, letterDuration],
            [0.5, 1, 1, 0.5]
          );
          
          return (
            <div
              key={index}
              style={{
                fontSize: 120,
                fontWeight: 'bold',
                color: theme === 'halloween' ? '#FFD700' : '#4169E1',
                opacity,
                transform: `scale(${scale})`,
                transition: 'all 0.3s ease',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {letter}
            </div>
          );
        })}
      </div>
      
      {/* Educational text */}
      <div
        style={{
          fontSize: 36,
          color: theme === 'halloween' ? '#FFFFFF' : '#000000',
          textAlign: 'center',
          maxWidth: 800,
          lineHeight: 1.4,
        }}
      >
        {frame > totalLetters * letterDuration + 30 && (
          <div>
            Your name is {childName}!<br />
            It has {childName.length} letters.<br />
            Can you spell it with me?
          </div>
        )}
      </div>
      
      {/* Celebration at the end */}
      {frame > totalLetters * letterDuration + 120 && (
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            fontSize: 48,
            color: '#FFD700',
            animation: 'bounce 1s infinite',
          }}
        >
          🎉 Great job, {childName}! 🎉
        </div>
      )}
    </AbsoluteFill>
  );
}; 