import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

interface LetterHuntProps {
  childName: string;
  letter: string;
  theme: string;
  age: number;
}

export const LetterHunt: React.FC<LetterHuntProps> = ({ childName, letter, theme, age }) => {
  const frame = useCurrentFrame();
  
  // Animation timing
  const introDuration = 60; // 1 second intro
  const letterShowDuration = 90; // 1.5 seconds per letter
  const totalLetters = 5; // Show 5 different letters including the target
  
  const getThemeColors = () => {
    switch (theme) {
      case 'halloween':
        return {
          background: '#1a1a2e',
          primary: '#FF6B35',
          secondary: '#FFD700',
          text: '#FFFFFF',
          highlight: '#FF4500'
        };
      case 'jungle':
        return {
          background: '#228B22',
          primary: '#32CD32',
          secondary: '#FFD700',
          text: '#FFFFFF',
          highlight: '#00FF00'
        };
      default:
        return {
          background: '#87CEEB',
          primary: '#2E8B57',
          secondary: '#4169E1',
          text: '#000000',
          highlight: '#FF4500'
        };
    }
  };
  
  const colors = getThemeColors();
  
  // Generate random letters (excluding the target letter)
  const generateRandomLetters = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.replace(letter, '');
    const randomLetters = [];
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      randomLetters.push(alphabet[randomIndex]);
    }
    return randomLetters;
  };
  
  const randomLetters = generateRandomLetters();
  const allLetters = [...randomLetters.slice(0, 2), letter, ...randomLetters.slice(2)];
  
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
      {/* Background decorations */}
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
      
      {theme === 'jungle' && (
        <>
          <div style={{ position: 'absolute', top: 20, left: 20, fontSize: 48 }}>
            🌴
          </div>
          <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 48 }}>
            🦁
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
          {childName}'s Letter Hunt!
        </div>
      )}
      
      {/* Letter hunt game */}
      {frame >= introDuration && (
        <>
          {/* Instructions */}
          <div
            style={{
              fontSize: 36,
              color: colors.text,
              textAlign: 'center',
              marginBottom: 60,
              opacity: interpolate(
                frame - introDuration,
                [0, 30, letterShowDuration * totalLetters - 30, letterShowDuration * totalLetters],
                [0, 1, 1, 0]
              ),
            }}
          >
            Can you find the letter <span style={{ color: colors.highlight, fontWeight: 'bold' }}>{letter}</span>?
          </div>
          
          {/* Letter grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 40,
              maxWidth: 600,
            }}
          >
            {allLetters.map((ltr, index) => {
              const letterFrame = frame - introDuration - (index * 30);
              const isTargetLetter = ltr === letter;
              
              return (
                <div
                  key={index}
                  style={{
                    width: 120,
                    height: 120,
                    border: `4px solid ${isTargetLetter ? colors.highlight : colors.secondary}`,
                    borderRadius: '20px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: 72,
                    fontWeight: 'bold',
                    color: isTargetLetter ? colors.highlight : colors.text,
                    backgroundColor: isTargetLetter ? `${colors.highlight}20` : 'transparent',
                    opacity: interpolate(
                      letterFrame,
                      [0, 15, letterShowDuration - 15, letterShowDuration],
                      [0, 1, 1, isTargetLetter ? 1 : 0.3]
                    ),
                    transform: `scale(${interpolate(
                      letterFrame,
                      [0, 15, letterShowDuration - 15, letterShowDuration],
                      [0.5, 1, 1, isTargetLetter ? 1.2 : 0.8]
                    )})`,
                    transition: 'all 0.3s ease',
                    boxShadow: isTargetLetter 
                      ? `0 0 20px ${colors.highlight}` 
                      : '0 4px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  {ltr}
                </div>
              );
            })}
          </div>
          
          {/* Success message */}
          {frame > introDuration + letterShowDuration * totalLetters + 30 && (
            <div
              style={{
                position: 'absolute',
                bottom: 100,
                fontSize: 48,
                color: colors.highlight,
                fontWeight: 'bold',
                opacity: interpolate(
                  frame - (introDuration + letterShowDuration * totalLetters + 30),
                  [0, 30],
                  [0, 1]
                ),
              }}
            >
              🎉 Great job, {childName}! You found {letter}! 🎉
            </div>
          )}
        </>
      )}
    </AbsoluteFill>
  );
}; 