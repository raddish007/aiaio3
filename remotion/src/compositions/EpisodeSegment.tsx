import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

interface EpisodeSegmentProps {
  childName: string;
  segmentType: string;
  theme: string;
  age: number;
  segmentTitle: string;
}

export const EpisodeSegment: React.FC<EpisodeSegmentProps> = ({ 
  childName, 
  segmentType, 
  theme, 
  age, 
  segmentTitle 
}) => {
  const frame = useCurrentFrame();
  
  // Animation timing
  const introDuration = 60; // 1 second intro
  const segmentDuration = 180; // 3 seconds for main segment
  const outroDuration = 60; // 1 second outro
  
  const getThemeColors = () => {
    switch (theme) {
      case 'halloween':
        return {
          background: '#1a1a2e',
          primary: '#FF6B35',
          secondary: '#FFD700',
          text: '#FFFFFF',
          accent: '#FF4500'
        };
      case 'ocean':
        return {
          background: '#006994',
          primary: '#00CED1',
          secondary: '#FFD700',
          text: '#FFFFFF',
          accent: '#87CEEB'
        };
      case 'space':
        return {
          background: '#0B1426',
          primary: '#4A90E2',
          secondary: '#F39C12',
          text: '#FFFFFF',
          accent: '#9B59B6'
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
  
  const getSegmentContent = () => {
    switch (segmentType) {
      case 'personalized':
        return {
          title: `${childName}'s Special Time`,
          content: [
            `Welcome to ${childName}'s special segment!`,
            `Today we're going to have so much fun together!`,
            `Are you ready for an amazing adventure, ${childName}?`,
            `Let's make today the best day ever!`
          ]
        };
      case 'educational':
        return {
          title: `${childName}'s Learning Time`,
          content: [
            `Hi ${childName}! Ready to learn something new?`,
            `Today we're going to discover amazing things!`,
            `Learning is so much fun when we do it together!`,
            `You're doing such a great job, ${childName}!`
          ]
        };
      case 'adventure':
        return {
          title: `${childName}'s Adventure Time`,
          content: [
            `Come on ${childName}, let's go on an adventure!`,
            `We're going to explore magical places together!`,
            `Every adventure is better with a friend like you!`,
            `What an amazing journey we're having, ${childName}!`
          ]
        };
      default:
        return {
          title: segmentTitle || `${childName}'s Special Time`,
          content: [
            `Welcome to ${childName}'s special show!`,
            `We're so happy you're here with us today!`,
            `Let's have the most fun together!`,
            `You're the star of the show, ${childName}!`
          ]
        };
    }
  };
  
  const segmentContent = getSegmentContent();
  
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
          <div style={{ position: 'absolute', bottom: 20, left: 20, fontSize: 48 }}>
            🦇
          </div>
        </>
      )}
      
      {theme === 'ocean' && (
        <>
          <div style={{ position: 'absolute', top: 20, left: 20, fontSize: 48 }}>
            🐠
          </div>
          <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 48 }}>
            🐙
          </div>
          <div style={{ position: 'absolute', bottom: 20, left: 20, fontSize: 48 }}>
            🐋
          </div>
        </>
      )}
      
      {theme === 'space' && (
        <>
          <div style={{ position: 'absolute', top: 20, left: 20, fontSize: 48 }}>
            🚀
          </div>
          <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 48 }}>
            🌟
          </div>
          <div style={{ position: 'absolute', bottom: 20, left: 20, fontSize: 48 }}>
            🌙
          </div>
        </>
      )}
      
      {/* Intro - Main title */}
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
          {segmentContent.title}
        </div>
      )}
      
      {/* Main segment content */}
      {frame >= introDuration && frame < introDuration + segmentDuration && (
        <div
          style={{
            fontSize: 48,
            color: colors.text,
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.6,
            opacity: interpolate(
              frame - introDuration,
              [0, 30, segmentDuration - 30, segmentDuration],
              [0, 1, 1, 0]
            ),
          }}
        >
          {(() => {
            const segmentFrame = frame - introDuration;
            const lineDuration = segmentDuration / segmentContent.content.length;
            const currentLine = Math.floor(segmentFrame / lineDuration);
            
            if (currentLine < segmentContent.content.length) {
              return (
                <div
                  style={{
                    opacity: interpolate(
                      segmentFrame - (currentLine * lineDuration),
                      [0, 30, lineDuration - 30, lineDuration],
                      [0, 1, 1, 0]
                    ),
                    transform: `translateY(${interpolate(
                      segmentFrame - (currentLine * lineDuration),
                      [0, 30],
                      [20, 0]
                    )}px)`,
                  }}
                >
                  {segmentContent.content[currentLine]}
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
      
      {/* Outro */}
      {frame >= introDuration + segmentDuration && (
        <div
          style={{
            fontSize: 48,
            color: colors.accent,
            textAlign: 'center',
            fontWeight: 'bold',
            opacity: interpolate(
              frame - (introDuration + segmentDuration),
              [0, 30],
              [0, 1]
            ),
          }}
        >
          🎉 Thanks for watching, {childName}! 🎉
        </div>
      )}
      
      {/* Floating elements */}
      {frame > introDuration + 30 && (
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            fontSize: 64,
            opacity: interpolate(
              frame,
              [introDuration + 30, introDuration + 90],
              [0, 0.7]
            ),
          }}
        >
          {theme === 'halloween' && '🕷️🦇'}
          {theme === 'ocean' && '🐠🐙'}
          {theme === 'space' && '🚀⭐'}
          {theme === 'general' && '✨🎈'}
        </div>
      )}
    </AbsoluteFill>
  );
}; 