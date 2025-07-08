import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

interface BedtimeSongProps {
  childName: string;
  theme: string;
  age: number;
}

export const BedtimeSong: React.FC<BedtimeSongProps> = ({ childName, theme, age }) => {
  const frame = useCurrentFrame();
  
  // Animation timing
  const introDuration = 60; // 1 second intro
  const verseDuration = 90; // 1.5 seconds per verse
  const totalVerses = 3;
  
  const getThemeColors = () => {
    switch (theme) {
      case 'halloween':
        return {
          background: '#1a1a2e',
          primary: '#FF6B35',
          secondary: '#FFD700',
          text: '#FFFFFF'
        };
      case 'space':
        return {
          background: '#0B1426',
          primary: '#4A90E2',
          secondary: '#F39C12',
          text: '#FFFFFF'
        };
      default:
        return {
          background: '#87CEEB',
          primary: '#2E8B57',
          secondary: '#4169E1',
          text: '#000000'
        };
    }
  };
  
  const colors = getThemeColors();
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background stars for space theme */}
      {theme === 'space' && (
        <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: '2px',
                height: '2px',
                backgroundColor: '#FFFFFF',
                opacity: interpolate(
                  frame + i * 10,
                  [0, 60, 120, 180],
                  [0.3, 1, 0.3, 1]
                ),
              }}
            />
          ))}
        </div>
      )}
      
      {/* Halloween decorations */}
      {theme === 'halloween' && (
        <>
          <div style={{ position: 'absolute', top: 20, left: 20, fontSize: 48 }}>
            🎃
          </div>
          <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 48 }}>
            👻
          </div>
        </>
      )}
      
      {/* Main title */}
      {frame < introDuration && (
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: colors.primary,
            marginBottom: 40,
            textAlign: 'center',
            opacity: interpolate(frame, [0, 30], [0, 1]),
            transform: `scale(${interpolate(frame, [0, 30], [0.8, 1])})`,
          }}
        >
          {childName}'s Bedtime Song
        </div>
      )}
      
      {/* Song verses */}
      {frame >= introDuration && (
        <div
          style={{
            fontSize: 48,
            color: colors.text,
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.6,
            opacity: interpolate(
              frame - introDuration,
              [0, 30, verseDuration * totalVerses - 30, verseDuration * totalVerses],
              [0, 1, 1, 0]
            ),
          }}
        >
          {(() => {
            const verseFrame = frame - introDuration;
            const currentVerse = Math.floor(verseFrame / verseDuration);
            
            switch (currentVerse) {
              case 0:
                return (
                  <div>
                    Goodnight, {childName}, my little star<br />
                    Time to rest, no matter how far<br />
                    Close your eyes and dream away<br />
                    Tomorrow is a brand new day
                  </div>
                );
              case 1:
                return (
                  <div>
                    The moon is bright, the stars are shining<br />
                    {childName}, it's time for sleeping<br />
                    Let your dreams take you away<br />
                    To places where you love to play
                  </div>
                );
              case 2:
                return (
                  <div>
                    Sweet dreams, {childName}, sleep tight<br />
                    Everything will be alright<br />
                    When you wake up in the morning light<br />
                    You'll be ready for a brand new sight
                  </div>
                );
              default:
                return null;
            }
          })()}
        </div>
      )}
      
      {/* Floating elements based on theme */}
      {frame > introDuration + 30 && (
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            fontSize: 64,
            opacity: interpolate(
              frame,
              [introDuration + 30, introDuration + 90],
              [0, 1]
            ),
          }}
        >
          {theme === 'space' && '🌙⭐'}
          {theme === 'halloween' && '🦇🕷️'}
          {theme === 'general' && '🌙✨'}
        </div>
      )}
    </AbsoluteFill>
  );
}; 