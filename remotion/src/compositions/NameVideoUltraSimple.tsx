import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useVideoConfig,
} from 'remotion';

interface NameVideoUltraSimpleProps {
  childName: string;
  backgroundMusic: string;
}

export const NameVideoUltraSimple: React.FC<NameVideoUltraSimpleProps> = ({
  childName,
  backgroundMusic,
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Background Music - plays for entire duration */}
      <Audio src={backgroundMusic} volume={0.3} />
      
      {/* Simple text display */}
      <div
        style={{
          color: 'white',
          fontSize: 120,
          fontWeight: 'bold',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {childName}
      </div>
    </AbsoluteFill>
  );
}; 