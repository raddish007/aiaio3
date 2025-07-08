import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  asset: {
    type: string;
    file_url?: string;
    metadata?: any; // Allow any metadata structure to support different asset types
  };
  className?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
}

export default function AudioPlayer({ 
  asset, 
  className = "", 
  showControls = true, 
  autoPlay = false, 
  muted = false 
}: AudioPlayerProps) {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (asset.type !== 'audio') return;

    // Priority: file_url first, then metadata.audio_data
    if (asset.file_url) {
      setAudioSrc(asset.file_url);
    } else if (asset.metadata?.audio_data) {
      setAudioSrc(asset.metadata.audio_data);
    } else {
      setError('No audio source available');
    }
  }, [asset]);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Failed to play audio');
      });
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  if (asset.type !== 'audio') {
    return null;
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-md p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <span className="text-red-500">🎵</span>
          <span className="text-sm text-red-700">Audio not available</span>
        </div>
      </div>
    );
  }

  if (!audioSrc) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-md p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">🎵</span>
          <span className="text-sm text-gray-500">Loading audio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-md p-3 ${className}`}>
      <div className="flex items-center space-x-3">
        <span className="text-blue-600 text-lg">🎵</span>
        
        <div className="flex-1">
          <audio
            ref={audioRef}
            controls={showControls}
            autoPlay={autoPlay}
            muted={muted}
            className="w-full"
            onLoadStart={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onError={() => setError('Failed to load audio')}
          >
            <source src={audioSrc} type="audio/wav" />
            <source src={audioSrc} type="audio/mpeg" />
            <source src={audioSrc} type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>
        </div>

        {isLoading && (
          <div className="flex items-center space-x-1">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-xs text-blue-600">Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
} 