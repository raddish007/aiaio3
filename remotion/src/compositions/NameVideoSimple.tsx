import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useVideoConfig,
} from 'remotion';

interface NameVideoSimpleProps {
  childName: string;
  backgroundMusicUrl: string;
  letterAudioUrl: string;
  letterName: string;
}

export const NameVideoSimple: React.FC<NameVideoSimpleProps> = ({
  childName,
  backgroundMusicUrl,
  letterAudioUrl,
  letterName,
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
      <Audio src={backgroundMusicUrl} volume={0.3} />
      
      {/* Letter Audio - plays at 5 seconds */}
      <Sequence fromInFrames={5 * fps}>
        <Audio src={letterAudioUrl} volume={0.8} />
      </Sequence>
      
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
      
      {/* Letter display */}
      <div
        style={{
          color: 'yellow',
          fontSize: 80,
          fontWeight: 'bold',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
          marginTop: 50,
        }}
      >
        Letter: {letterName}
      </div>
    </AbsoluteFill>
  );
}; 