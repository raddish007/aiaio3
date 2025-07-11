import React from 'react';
import {
  AbsoluteFill, 
  Audio
} from 'remotion';

export interface NameVideoTestProps {
  childName: string;
  letterAudioUrls: { [letter: string]: string };
  debugMode?: boolean;
}

export const NameVideoTest: React.FC<NameVideoTestProps> = ({
  childName,
  letterAudioUrls,
  debugMode = true
}) => {
  const letters = childName.toUpperCase().split('');
  
  console.log(`🧪 NameVideoTest for "${childName}":`, {
    letters,
    letterAudioUrls,
    availableLetters: Object.keys(letterAudioUrls)
  });

  return (
    <AbsoluteFill style={{
      backgroundColor: '#4A90E2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '48px',
      fontWeight: 'bold'
    }}>
      {/* Test each letter audio */}
      {letters.map((letter, index) => {
        const audioUrl = letterAudioUrls[letter];
        
        console.log(`🧪 Letter "${letter}" (index ${index}):`, {
          hasAudio: !!audioUrl,
          audioUrl: audioUrl || 'not found'
        });
        
        return (
          <div key={`${letter}-${index}`} style={{ margin: '0 20px' }}>
            {letter}
            {audioUrl && (
              <Audio 
                src={audioUrl}
                volume={0.8}
              />
            )}
          </div>
        );
      })}
      
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '20px', 
        fontSize: '16px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <div>Child: {childName}</div>
        <div>Letters: {letters.join(', ')}</div>
        <div>Audio URLs: {Object.keys(letterAudioUrls).length}</div>
        <div>Available: {Object.keys(letterAudioUrls).join(', ')}</div>
      </div>
    </AbsoluteFill>
  );
}; 